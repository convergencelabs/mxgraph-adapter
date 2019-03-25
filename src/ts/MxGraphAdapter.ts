import {
  ObjectRemoveEvent,
  ObjectSetEvent,
  RealTimeObject
} from "@convergence/convergence";
import {mxCell, mxChildChange, mxEvent, mxGraph, mxRootChange} from "mxgraph";

import {Deserializer, Serializer} from "./";
import {MxCellAdapter} from "./MxCellAdapter";

interface IMxCellsAdded {
  properties: { cells: mxCell[] };
}

interface IMxCellsRemoved {
  properties: { cells: mxCell[] };
}

export class MxGraphAdapter {

  private static readonly _CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  private static readonly _ID_LENGTH = 32;

  private static _generateId() {
    let text = "";
    for (let i = 0; i < MxGraphAdapter._ID_LENGTH; i++) {
      text += MxGraphAdapter._CHARS.charAt(Math.floor(Math.random() * MxGraphAdapter._CHARS.length));
    }
    return text;
  }

  private readonly _mxGraph: mxGraph;
  private readonly _rtCells: RealTimeObject;
  private readonly _listeners: any[];
  private readonly _cellAdapters: Map<mxCell, MxCellAdapter>;

  constructor(graph: mxGraph, rtGraph: RealTimeObject) {
    this._mxGraph = graph;
    this._rtCells = rtGraph.get("cells") as RealTimeObject;

    this._listeners = [];

    this._cellAdapters = new Map();

    // Listen for local changes
    this._mxGraph.addListener(mxEvent.CELLS_ADDED,
      (_: any, evt: IMxCellsAdded) => this._handleLocalCellsAdded(evt));
    this._mxGraph.addListener(mxEvent.CELLS_REMOVED,
      (_: any, evt: IMxCellsRemoved) => this._handleLocalCellsRemoved(evt));
    this._mxGraph.model.addListener(mxEvent.CHANGE,
      (_: any, evt: any) => {
        const edit = evt.getProperty("edit");
        edit.changes.forEach((change: any) => this._processLocalChange(change));
      });

    // Listen for remote changes
    this._rtCells.on("set", (e: ObjectSetEvent) => this._handleRemoteCellAdded(e));
    this._rtCells.on("remove", (e: ObjectRemoveEvent) => this._handleRemoteCellRemoved(e));

    Object.keys(this._mxGraph.model.cells).forEach((id: string) => {
      const cell = this._mxGraph.model.cells[id];
      const rtCell = this._rtCells.get(id) as RealTimeObject;
      this._bindMxCellAdapter(cell, rtCell);
    });
  }

  public addListener(listener: any): void {
    this._listeners.push(listener);
  }

  private _bindMxCellAdapter(mxGraphCell: mxCell, rtCell: RealTimeObject): void {
    const adapter = new MxCellAdapter(mxGraphCell, rtCell, this._mxGraph, this._fireEvent.bind(this));
    this._cellAdapters.set(mxGraphCell, adapter);
  }

  private _handleLocalCellsAdded(evt: IMxCellsAdded): void {
    const {properties} = evt;
    const cells = properties.cells;

    cells.forEach((cell: mxCell) => {
      this._handlePotentiallyNewCell(cell);
    });
  }

  private _handlePotentiallyNewCell(cell: mxCell): void {
    if (!cell.id) {
      const id = MxGraphAdapter._generateId();
      this._mxGraph.model.cells[id] = cell;
      cell.id = id;
      const cellJson = Serializer.serializeMxCell(cell);
      const rtCell = this._rtCells.set(cell.id, cellJson) as RealTimeObject;
      this._bindMxCellAdapter(cell, rtCell);
    }
  }

  private _handleLocalCellsRemoved(evt: IMxCellsRemoved): void {
    const {properties} = evt;
    const cells = properties.cells;

    cells.forEach((cell: mxCell) => {
      const cellId = cell.id;
      this._rtCells.remove(cellId);
      this._cellAdapters.delete(cell);
    });

    this._fireEvent("onCellsRemoved", {cells});
  }

  private _handleRemoteCellAdded(e: ObjectSetEvent): void {
    const cellId = e.key;
    const cellJson = e.value.value();
    const cell = Deserializer.deserializeMxCell(cellId, cellJson);
    Deserializer.resolveCellRelationships(cell, cellJson, this._mxGraph.model);
    this._mxGraph.model.cellAdded(cell);
    this._mxGraph.view.refresh();
    this._bindMxCellAdapter(cell, e.value as RealTimeObject);
  }

  private _handleRemoteCellRemoved(e: ObjectRemoveEvent): void {
    const cellId = e.key;
    const cell = this._mxGraph.model.cells[cellId];
    this._cellAdapters.delete(cell);
    this._mxGraph.model.remove(cell);
    this._mxGraph.view.refresh();
    this._fireEvent("onCellsRemoved", {cells: [cell]});
  }

  private _processLocalChange(change: any) {
    if (change instanceof mxRootChange) {
      if (change.root === this._mxGraph.model.root) {
        // todo
        console.warn("unhandled root change");
      }
    } else if (change instanceof mxChildChange) {
      this._processLocalChildChange(change);
    } else if (change.cell != null && change.cell.id != null) {
      const adapter = this._cellAdapters.get(change.cell);
      adapter.processChange(change);
    }
  }

  private _processLocalChildChange(change: mxChildChange) {
    const {child} = change;
    if (!child.id) {
      this._handlePotentiallyNewCell(child);
    } else {
      const adapter = this._cellAdapters.get(child);
      if (adapter) {
        adapter.processChange(change);
      }
    }
  }

  private _fireEvent(name: string, evt: any) {
    this._listeners.forEach((listener: any) => {
      try {
        const callback = listener[name];
        if (callback) {
          callback(evt);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }
}
