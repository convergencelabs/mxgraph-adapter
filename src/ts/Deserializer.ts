import {mxCell, mxGeometry, mxGraphModel, mxPoint} from "mxgraph";
import {
  ICellData,
  IGeometry,
  IModelData,
  IPoint,
  IStyleData
} from "./MxGraphData";

export class Deserializer {

  public static deserializeMxGraphModel(json: IModelData): mxGraphModel {
    const cells = {...json.cells};
    const rootJson = cells[json.root];
    delete cells[json.root];

    const rootCell = Deserializer.deserializeMxCell(json.root, rootJson);

    const model = new mxGraphModel();
    model.createIds = false;

    model.setRoot(rootCell);

    Object.keys(cells).forEach((cellId) => {
      const cellJson = cells[cellId];
      const cell = Deserializer.deserializeMxCell(cellId, cellJson);
      model.cellAdded(cell);
    });

    Object.keys(cells).forEach((cellId) => {
      const cell = model.cells[cellId];
      const cellData = cells[cellId];
      Deserializer.resolveCellRelationships(cell, cellData, model);
    });

    return model;
  }

  public static deserializeMxCell(id: string, cellData: ICellData): mxCell {
    const value = Deserializer.deserializeValue(cellData.value);
    const style = Deserializer.deserializeStyle(cellData.style);
    const geometry = Deserializer.deserializeGeometry(cellData.geometry);

    const cell = new mxCell(value, geometry, style);
    cell.id = id;

    if (cellData.collapsed !== undefined) {
      cell.setCollapsed(cellData.collapsed);
    }

    if (cellData.connectable !== undefined) {
      cell.setConnectable(cellData.connectable);
    }

    if (cellData.visible !== undefined) {
      cell.setVisible(cellData.visible);
    }

    if (cellData.vertex === true) {
      cell.setVertex(true);
    }

    if (cellData.edge === true) {
      cell.setEdge(true);
    }

    if (cellData.style !== undefined) {
      cell.setStyle(Deserializer.deserializeStyle(cellData.style));
    }

    return cell;
  }

  public static resolveCellRelationships(
    cell: mxCell,
    cellData: ICellData,
    model: mxGraphModel): void {

    if (cellData.parent) {
      const parent = model.cells[cellData.parent];
      parent.insert(cell);
    }

    if (cellData.source) {
      const source = model.cells[cellData.source];
      source.insertEdge(cell, true);
    }

    if (cellData.target) {
      const target = model.cells[cellData.target];
      target.insertEdge(cell, false);
    }
  }

  public static deserializeValue(jsonValue: any): any {
    // TODO handle an xml node.
    return jsonValue;
  }

  public static deserializeStyle(jsonStyle: IStyleData): string {
    if (jsonStyle === undefined) {
      return;
    }

    let style = "";
    jsonStyle.classes.forEach((className: string) => {
      style += className + ";";
    });

    Object.keys(jsonStyle.styles).forEach((key: string) => {
      const value = jsonStyle.styles[key];
      style += key + "=" + value + ";";
    });

    return style;
  }

  public static deserializeGeometry(geom: IGeometry): mxGeometry {
    if (!geom) {
      return;
    }

    const result = new mxGeometry(geom.x, geom.y, geom.width, geom.height);

    if (geom.points) {
      result.points = geom.points.map((p: IPoint) => Deserializer.deserializePoint(p));
    }

    if (geom.sourcePoint) {
      result.setTerminalPoint(Deserializer.deserializePoint(geom.sourcePoint), true);
    }

    if (geom.targetPoint) {
      result.setTerminalPoint(Deserializer.deserializePoint(geom.targetPoint), false);
    }

    result.relative = geom.relative;

    if (geom.offset) {
      result.offset = Deserializer.deserializePoint(geom.offset);
    }

    return result;
  }

  public static deserializePoint(jsonPoint: IPoint): mxPoint {
    return new mxPoint(jsonPoint.x, jsonPoint.y);
  }
}
