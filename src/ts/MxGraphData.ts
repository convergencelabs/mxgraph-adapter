export interface IModelData {
  cells: {[key: string]: ICellData};
  root: string;
}

export interface ICellData {
  id: string;
  geometry?: IGeometry;
  style?: IStyleData;
  value?: any;
  vertex?: boolean;
  edge?: boolean;
  collapsed?: boolean;
  visible?: boolean;
  connectable?: boolean;
  parent?: string;
  source?: string;
  target?: string;
}

export interface IPoint {
  x: number;
  y: number;
}

export interface IRectangle extends IPoint {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface IGeometry extends IRectangle {
  x: number;
  y: number;
  height: number;
  width: number;
  points?: IPoint[];
  sourcePoint?: IPoint;
  targetPoint?: IPoint;
  relative?: boolean;
  offset?: IPoint;
}

export interface IStyleData {
  styles: {[key: string]: any};
  classes: string[];
}
