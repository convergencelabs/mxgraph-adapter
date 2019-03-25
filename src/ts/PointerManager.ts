import {
  Activity,
  ActivityParticipant,
  ActivitySessionJoinedEvent,
  ActivitySessionLeftEvent,
  ActivityStateRemovedEvent,
  ActivityStateSetEvent
} from "@convergence/convergence";
import {mxGraph} from "mxgraph";
import {ActivityColorManager} from "./ActivityColorManager";

export class PointerManager {

  private static _SVG_NS = "http://www.w3.org/2000/svg";
  private static _CURSOR_PATH = "M 0,0 L 0,0 11.6,11.6 6.7,11.6 9.6,18.3 6.0,20.2 3.1,13.3 0,16z";
  private static _POINTER_KEY = "pointer";

  private readonly _mxGraph: mxGraph;
  private readonly _activity: Activity;
  private readonly _colorManager: ActivityColorManager;
  private readonly _remotePointers: Map<string, HTMLElement>;
  private readonly _root: SVGElement;

  private _active: boolean;

  constructor(graph: mxGraph, activity: Activity, colorManager: ActivityColorManager) {
    this._mxGraph = graph;
    this._activity = activity;
    this._colorManager = colorManager;
    this._remotePointers = new Map();
    this._root = this._mxGraph.view.getOverlayPane() as any as SVGElement;

    this._active = true;

    this._listenToGraph();
    this._listenToActivity();

    this._activity.participants().forEach((participant: ActivityParticipant) => {
      this._addRemotePointer(participant);
    });
  }

  private _listenToGraph(): void {
    this._root.ownerSVGElement.addEventListener("mouseleave", () => {
      this._activity.removeState(PointerManager._POINTER_KEY);
      this._active = false;
    });

    this._root.ownerSVGElement.addEventListener("mouseenter", () => {
      this._active = true;
    });

    this._mxGraph.addMouseListener({
      mouseDown: () => {
        // No-Op
      },
      mouseMove: (_: any, evt: any) => {
        if (this._active) {
          const {graphX, graphY} = evt;
          const scale = this._mxGraph.view.scale;
          const translate = this._mxGraph.view.translate;
          const tX = Math.round((graphX - translate.x * scale) / scale);
          const tY = Math.round((graphY - translate.y * scale) / scale);
          const pointerState = {x: tX, y: tY};
          this._activity.setState(PointerManager._POINTER_KEY, pointerState);
        }
      },
      mouseUp: () => {
        // Click animation.
      }
    });
  }

  private _listenToActivity(): void {
    this._activity.on("session_joined", (e: ActivitySessionJoinedEvent) => {
      this._addRemotePointer(e.participant);
    });

    this._activity.on("session_left", (e: ActivitySessionLeftEvent) => {
      const remotePointer = this._remotePointers.get(e.sessionId);
      remotePointer.parentElement.removeChild(remotePointer);
      this._remotePointers.delete(e.sessionId);
    });

    this._activity.on("state_set", (e: ActivityStateSetEvent) => {
      const {key, value, sessionId, local} = e;
      if (!local && key === PointerManager._POINTER_KEY) {
        const remotePointer = this._remotePointers.get(sessionId);
        const scale = this._mxGraph.view.scale;
        const translate = this._mxGraph.view.translate;
        const graphX = Math.round((value.x + translate.x) * scale);
        const graphY = Math.round((value.y + translate.y) * scale);
        remotePointer.setAttributeNS(null, "transform", `translate(${graphX},${graphY})`);
        remotePointer.setAttributeNS(null, "visibility", "visible");
      }
    });

    this._activity.on("state_removed", (e: ActivityStateRemovedEvent) => {
      const {key, sessionId, local} = e;
      if (!local && key === "pointer") {
        const remotePointer = this._remotePointers.get(sessionId);
        remotePointer.setAttributeNS(null, "visibility", "hidden");
      }
    });
  }

  private _addRemotePointer(participant: ActivityParticipant): void {
    if (!participant.local) {
      const pointer = participant.state.get(PointerManager._POINTER_KEY) || {x: 0, y: 0};
      const remotePointer = document.createElementNS(PointerManager._SVG_NS, "path");
      remotePointer.setAttributeNS(null, "d", PointerManager._CURSOR_PATH);
      remotePointer.setAttributeNS(null, "transform", `translate(${pointer.x},${pointer.y})`);
      const color = this._colorManager.color(participant.sessionId);
      remotePointer.setAttributeNS(null, "fill", color);
      remotePointer.setAttributeNS(null, "stroke", color);
      this._remotePointers.set(participant.sessionId, remotePointer as HTMLElement);
      this._root.appendChild(remotePointer);

      if (!participant.state.has(PointerManager._POINTER_KEY)) {
        remotePointer.setAttributeNS(null, "visibility", "hidden");
      }
    }
  }
}
