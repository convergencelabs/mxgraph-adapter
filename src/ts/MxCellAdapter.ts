import {
  ArrayInsertEvent,
  ArrayRemoveEvent,
  ObjectRemoveEvent,
  ObjectSetEvent,
  RealTimeArray,
  RealTimeObject
} from "@convergence/convergence";
import {
  mxCell,
  mxChildChange,
  mxCollapseChange,
  mxGeometryChange,
  mxGraph,
  mxStyleChange,
  mxTerminalChange,
  mxValueChange,
  mxVisibleChange
} from "mxgraph";

import {Deserializer, Serializer} from "./";
import {IGeometry, IStyleData} from "./MxGraphData";

interface IStyleDiffs {
  addedClasses: string[];
  removedClasses: string[];
  changedStyles: {[key: string]: any};
}

export class MxCellAdapter {

  private readonly _mxCell: mxCell;
  private readonly _mxGraph: mxGraph;
  private readonly _rtCell: RealTimeObject;
  private readonly _rtGeometry: RealTimeObject;
  private readonly _eventCallback: (event: string, value: any) => void;
  private _rtStyle: RealTimeObject | null;
  private _rtStyles: RealTimeObject | null;
  private _rtClasses: RealTimeArray | null;

  constructor(cell: mxCell, rtCell: RealTimeObject, graph: mxGraph, eventEmitter: () => void) {
    this._mxCell = cell;
    this._rtCell = rtCell;
    this._mxGraph = graph;
    this._eventCallback = eventEmitter;
    this._rtGeometry = null;

    this._initCell();
    this._rtGeometry = this._initRtGeometry();
    this._initStyle();
  }

  public processChange(change: any): void {
    if (change instanceof mxTerminalChange) {
      this._localTerminalChanged(change);
    } else if (change instanceof mxGeometryChange) {
      this._localGeometryChanged(change);
    } else if (change instanceof mxStyleChange) {
      this._localStyleChanged(change);
    } else if (change instanceof mxValueChange) {
      this._localValueChanged(change);
    } else if (change instanceof mxCollapseChange) {
      this._localCollapsedChanged(change);
    } else if (change instanceof mxVisibleChange) {
      this._localVisibleChanged(change);
    } else if (change instanceof mxChildChange) {
      this._localChildChange(change);
    }
  }

  private _localGeometryChanged(change: mxGeometryChange): void {
    const {geometry} = change;
    const geometryJson = Serializer.serializeGeometry(geometry);
    this._rtGeometry.value(geometryJson);
    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _localCollapsedChanged(change: mxCollapseChange): void {
    const {collapsed} = change;
    this._rtCell.set("collapsed", collapsed);
    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _localVisibleChanged(change: mxVisibleChange): void {
    const {visible} = change;
    this._rtCell.set("visible", visible);
    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _localValueChanged(change: mxValueChange): void {
    const {value} = change;
    this._rtCell.set("value", value);
    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _localTerminalChanged(change: mxTerminalChange): void {
    const {source, terminal, previous} = change;
    const prop = source ? "source" : "target";

    if (terminal !== previous) {
      const value = terminal !== null ? terminal.id : null;
      this._rtCell.set(prop, value);
    }

    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _localStyleChanged(change: mxStyleChange): void {
    const {previous, style} = change;
    const oldStyle = Serializer.serializeStyle(previous);
    const newStyle = Serializer.serializeStyle(style);

    // check for lazy style initialization
    if (!this._rtStyle) {
      this._rtCell.set("style", newStyle);
      this._initStyle();
    } else {
      const diff = this._diffStyles(newStyle, oldStyle);
      this._applyStyleChanges(diff);
    }

    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _diffStyles(newStyles: any, oldStyles: any): IStyleDiffs {
    const addedClasses = newStyles.classes.filter((c: string) => oldStyles.classes.indexOf(c) >= 0);
    const removedClasses = oldStyles.classes.filter((c: string) => newStyles.classes.indexOf(c) < 0);

    const changedStyles: any = {};

    // Process all new styles
    for (const styleName in newStyles.styles) {
      if (newStyles.styles.hasOwnProperty(styleName)) {
        const newValue = newStyles.styles[styleName];
        const oldValue = oldStyles.styles[styleName];

        if (newValue !== oldValue) {
          changedStyles[styleName] = newValue;
        }
      }
    }

    // look for removed styles
    for (const styleName in oldStyles.styles) {
      if (typeof newStyles.styles[styleName] === "undefined") {
        changedStyles[styleName] = null;
      }
    }
    return {addedClasses, removedClasses, changedStyles};
  }

  private _applyStyleChanges(styleDiff: IStyleDiffs): void {
    this._rtStyle.model().startBatch();
    styleDiff.removedClasses.forEach((c) => {
      const oldClasses = this._rtClasses.value();
      const index = oldClasses.indexOf(c);
      this._rtClasses.remove(index);
    });

    styleDiff.addedClasses.forEach((c) => {
      this._rtClasses.push(c);
    });

    for (const styleName in styleDiff.changedStyles) {
      if (styleDiff.changedStyles.hasOwnProperty(styleName)) {
        const newValue = styleDiff.changedStyles[styleName];

        if (newValue !== null) {
          this._rtStyles.set(styleName, newValue);
        } else {
          this._rtStyles.remove(styleName);
        }
      }
    }

    this._rtStyle.model().endBatch();
  }

  private _localChildChange(change: mxChildChange): void {
    const {parent} = change;
    this._rtCell.set("parent", parent === null ? null : parent.id);
    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }

  private _initCell() {
    this._rtCell.on("set", (e: ObjectSetEvent) => {
      switch (e.key) {
        case "parent":
          const parentId = e.value.value();
          const parent = parentId === null ? null : this._mxGraph.model.cells[parentId];
          this._mxCell.setParent(parent);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
        case "target":
          const targetId = e.value.value();
          const target = targetId === null ? null : this._mxGraph.model.cells[targetId];
          this._mxCell.setTerminal(target, false);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
        case "source":
          const sourceId = e.value.value();
          const source = sourceId === null ? null : this._mxGraph.model.cells[sourceId];
          this._mxCell.setTerminal(source, true);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
        case "style":
          this._initStyle();
          const newStyle = Deserializer.deserializeStyle(this._rtStyle.value() as IStyleData);
          this._mxCell.setStyle(newStyle);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
        case "value":
          const value = e.value.value();
          this._mxCell.setValue(value);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
        case "visible":
          const visible = e.value.value();
          this._mxCell.setVisible(visible);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
        case "collapsed":
          const collapsed = e.value.value();
          this._mxCell.setCollapsed(collapsed);
          this._mxGraph.view.refresh();
          this._eventCallback("onCellChanged", {cell: this._mxCell});
          break;
      }
    });
  }

  private _initRtGeometry(): RealTimeObject | null {
    if (this._rtCell.hasKey("geometry")) {
      const rtGeometry = this._rtCell.get("geometry") as RealTimeObject;
      rtGeometry.on("value", () => {
        const geometry = Deserializer.deserializeGeometry(rtGeometry.value() as IGeometry);
        this._mxCell.setGeometry(geometry);
        this._mxGraph.view.refresh();
        setTimeout(() => {
          this._eventCallback("onCellChanged", {cell: this._mxCell});
        }, 0);
      });
      return rtGeometry;
    } else {
      return null;
    }
  }

  private _initStyle() {
    if (this._rtCell.hasKey("style")) {
      this._rtStyle = this._rtCell.get("style") as RealTimeObject;

      this._rtStyles = this._rtStyle.get("styles") as RealTimeObject;
      this._rtStyles.on("set", (e: ObjectSetEvent) => {
        this._mutateStyle((cellStyle: any) => {
          const styleName = e.key;
          cellStyle.styles[styleName] = e.value.value();
        });
      });

      this._rtStyles.on("remove", (e: ObjectRemoveEvent) => {
        this._mutateStyle((cellStyle: any) => {
          const styleName = e.key;
          delete cellStyle.styles[styleName];
        });
      });

      this._rtClasses = this._rtStyle.get("classes") as RealTimeArray;
      this._rtClasses.on("insert", (e: ArrayInsertEvent) => {
        this._mutateStyle((cellStyle: any) => {
          const className = e.value.value();
          cellStyle.classes.push(className);
        });
      });

      this._rtClasses.on("remove", (e: ArrayRemoveEvent) => {
        this._mutateStyle((cellStyle: any) => {
          const className = e.oldValue.value();
          const index = cellStyle.classes.indexOf(className);
          cellStyle.classes.splice(index, 1);
        });
      });
    }
  }

  private _mutateStyle(mutate: (current: any) => void) {
    const cellStyle = Serializer.serializeStyle(this._mxCell.style);
    mutate(cellStyle);
    const newStyle = Deserializer.deserializeStyle(cellStyle);
    this._mxCell.setStyle(newStyle);
    this._mxGraph.view.removeState(this._mxCell);
    this._mxGraph.view.refresh();
    this._eventCallback("onCellChanged", {cell: this._mxCell});
  }
}
