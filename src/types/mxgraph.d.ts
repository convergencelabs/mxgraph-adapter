/* tslint:disable:class-name max-classes-per-file */

declare module "mxgraph" {
  export class mxEventSource {
    public addListener(name: string, callback: (sender: any, evt: any) => void): void;
  }

  export class mxGraphModel extends mxEventSource {
    public root: mxCell;
    public createIds: boolean;
    public cells: { [key: string]: mxCell };

    public setRoot(cell: mxCell): void;

    public cellAdded(cell: mxCell): void;

    public remove(cell: mxCell): mxCell;
  }

  export class mxGraph extends mxEventSource {
    public model: mxGraphModel;
    public root: mxCell;
    public view: mxGraphView;
    public selectionCellsHandler: mxSelectionCellsHandler;

    public addMouseListener(listener: any): void;

    public getSelectionCells(): mxCell[];
  }

  export class mxGraphView extends mxEventSource {
    public scale: number;
    public translate: mxPoint;

    public getState(cell: mxCell): mxCellState;

    public refresh(): void;

    public removeState(cell: mxCell): void;

    public getOverlayPane(): HTMLElement;
  }

  export class mxCellState {

  }

  export class mxCell extends mxEventSource {

    public id: string;
    public style: stirng;
    public value: any;
    public edge: any;
    public vertex: any;
    public visible: boolean;
    public collapsed: boolean;
    public connectable: boolean;
    public parent: mxCell | null;
    public source: mxCell | null;
    public target: mxCell | null;
    public geometry: mxGeometry;

    constructor(value?: any, geometry?: mxGeometry, style?: string);

    public insert(child: mxCell, index?: number): mxCell;

    public insertEdge(edge: mxCell, isOutgoing: boolean): mxCell;

    public setParent(parent: mxCell): void;

    public setTerminal(terminal: mxCell, source: boolean): void;

    public setStyle(style: string): void;

    public setValue(valud: any): void;

    public setGeometry(geometry: mxGeometry): void;

    public setCollapsed(collapsed: boolean): void;

    public setConnectable(connectable: boolean): void;

    public setEdge(edge: boolean): void;

    public setVertex(vertex: boolean): void;

    public setVisible(visible: boolean): void;
  }

  export class mxSelectionCellsHandler extends mxEventSource {
    public getHandler(cell: mxCell): any;
  }

  export const mxEvent: {
    ADD: strin;
    CHANGE: string;
    CELLS_ADDED: string;
    CELLS_REMOVED: string;
    REMOVE: string;
  };

  export class mxRootChange {
    public root: mxCell;
  }

  export class mxChildChange {
    public model: mxGraphModel;
    public parent: mxCell | null;
    public previous: mxCell | null;
    public child: mxCell;
    public index: number;
    public previousIndex: number;
  }

  export class mxTerminalChange {
    public model: mxGraphModel;
    public cell: mxCell;
    public terminal: mxCell | null;
    public source: boolean;
    public previous: stirng;
  }

  export class mxGeometryChange {
    public model: mxGraphModel;
    public cell: mxCell;
    public geometry: any;
    public previous: stirng;
  }

  export class mxStyleChange {
    public model: mxGraphModel;
    public cell: mxCell;
    public style: string;
    public previous: stirng;
  }

  export class mxValueChange {
    public model: mxGraphModel;
    public cell: mxCell;
    public value: any;
    public previous: stirng;
  }

  export class mxCollapseChange {
    public model: mxGraphModel;
    public cell: mxCell;
    public collapsed: boolean;
    public previous: stirng;
  }

  export class mxVisibleChange {
    public model: mxGraphModel;
    public cell: mxCell;
    public visible: boolean;
    public previous: stirng;
  }

  export class mxPoint {
    public x: numnber;
    public y: number;

    constructor(x?: number, y?: number);
  }

  export class mxRectangle extends mxPoint {
    public height: number;
    public width: number;

    constructor(x?: number, y?: number, width?: number, height?: number);
  }

  export class mxGeometry extends mxRectangle {
    public points: mxPoint[];
    public relative: boolean;
    public sourcePoint?: mxPoint;
    public targetPoint?: mxPoint;
    public offset: mxPoint;

    constructor(x?: number, y?: number, width?: number, height?: number);

    public setTerminalPoint(point: any, isSource: any): any;
  }

  export class mxCellHighlight {
    constructor(graph: mxGraph, highlightColor: string, strokeWidth: number, dashed: boolean);

    public highlight(cell: mxCellState | null): void;

    public destroy(): void;
  }

  export class mxVertexHandler {
    public redraw(): void;
  }

  export class mxEdgeHandler {
    public redraw(): void;
  }
}
