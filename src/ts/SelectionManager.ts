import {
  Activity,
  ActivityParticipant,
  ActivitySessionJoinedEvent,
  ActivitySessionLeftEvent,
  ActivityStateSetEvent
} from "@convergence/convergence";
import {mxCell, mxCellHighlight, mxEvent, mxGraph, mxSelectionCellsHandler} from "mxgraph";
import {ActivityColorManager} from "./ActivityColorManager";
import {MxGraphAdapter} from "./MxGraphAdapter";

interface IRemoteSelection {
  cells: { [key: string]: mxCellHighlight };
}

export class SelectionManager {
  private static readonly _SELECTION_KEY = "selection";

  private readonly _mxGraph: mxGraph;
  private readonly _activity: Activity;
  private readonly _colorManager: ActivityColorManager;
  private readonly _remoteSelectionsBySessionId: Map<string, IRemoteSelection>;
  private readonly _selectionHandler: mxSelectionCellsHandler;

  constructor(
    graph: mxGraph,
    activity: Activity,
    colorManager: ActivityColorManager,
    modelAdapter: MxGraphAdapter) {
    this._mxGraph = graph;
    this._activity = activity;
    this._colorManager = colorManager;

    modelAdapter.addListener({
      onCellsRemoved: (evt: any) => {
        evt.cells.forEach((cell: mxCell) => {
          this._cellRemoved(cell);
        });
      },
      onCellChanged: (evt: any) => this._cellUpdated(evt.cell)
    });

    this._remoteSelectionsBySessionId = new Map();
    this._selectionHandler = this._mxGraph.selectionCellsHandler;
    this._selectionHandler.addListener(mxEvent.ADD, () => {
      this._setSelection();
    });

    this._selectionHandler.addListener(mxEvent.REMOVE, () => {
      this._setSelection();
    });

    this._activity.on("session_joined", (e: ActivitySessionJoinedEvent) => {
      this._addRemoteSelection(e.participant);
    });

    this._activity.on("session_left", (e: ActivitySessionLeftEvent) => {
      this._updateRemoteSelection(e.sessionId, []);
      this._remoteSelectionsBySessionId.delete(e.sessionId);
    });

    this._activity.on("state_set", (e: ActivityStateSetEvent) => {
      const {key, value, sessionId, local} = e;
      if (!local && key === SelectionManager._SELECTION_KEY) {
        this._updateRemoteSelection(sessionId, value);
      }
    });

    this._activity.participants().forEach((participant: ActivityParticipant) => {
      this._addRemoteSelection(participant);
    });
  }

  private _setSelection(): void {
    const selectedCells = this._mxGraph.getSelectionCells();
    const cellIds = selectedCells.map((c: mxCell) => c.id)
    this._activity.setState(SelectionManager._SELECTION_KEY, cellIds);
  }

  private _addRemoteSelection(participant: ActivityParticipant): void {
    if (!participant.local) {
      const selection = participant.state.get(SelectionManager._SELECTION_KEY) || [];
      this._updateRemoteSelection(participant.sessionId, selection);
    }
  }

  private _cellUpdated(cell: mxCell): void {
    const handler = this._mxGraph.selectionCellsHandler.getHandler(cell);
    if (handler) {
      handler.redraw();
    }

    this._remoteSelectionsBySessionId.forEach((remoteSelection: IRemoteSelection) => {
      const highlighter = remoteSelection.cells[cell.id];
      if (highlighter) {
        const cellState = this._mxGraph.view.getState(cell);
        highlighter.highlight(null);
        highlighter.highlight(cellState);
      }
    });
  }

  private _cellRemoved(cell: mxCell): void {
    this._remoteSelectionsBySessionId.forEach((remoteSelection: IRemoteSelection) => {
      const cellSelection = remoteSelection.cells[cell.id];
      if (cellSelection) {
        cellSelection.destroy();
        delete remoteSelection.cells[cell.id];
      }
    });
  }

  private _updateRemoteSelection(sessionId: string, cellIds: string[]): void {
    const currentSelection = this._remoteSelectionsBySessionId.get(sessionId);
    if (currentSelection) {
      Object.keys(currentSelection.cells).forEach((cellId: string) => {
        const shape = currentSelection.cells[cellId];
        shape.destroy();
      });
      this._remoteSelectionsBySessionId.delete(sessionId);
    }

    if (cellIds && cellIds.length > 0) {
      const selection: IRemoteSelection = {
        cells: {}
      };

      cellIds.forEach((cellId: string) => {
        const cell = this._mxGraph.model.cells[cellId];
        if (cell !== null) {
          const color = this._colorManager.color(sessionId);
          const highlighter = new mxCellHighlight(this._mxGraph, color, 3, false);
          const cellState = this._mxGraph.view.getState(cell);
          highlighter.highlight(cellState);
          selection.cells[cellId] = highlighter;
        }
      });
      this._remoteSelectionsBySessionId.set(sessionId, selection);
    }
  }
}
