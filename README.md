<img src=./docs/logo.png" height="75" />

# Convergence mxGraph Adapter
[![Build Status](https://travis-ci.org/convergencelabs/mxgraph-adapter.svg?branch=master)](https://travis-ci.org/convergencelabs/mxgraph-adapter)

The **Convergence mxGraph Adapter** makes it easy to provide a collaborative diagram editing experience using [mxGraph](https://github.com/jgraph/mxgraph) and [Convergence](https://convergence.io). This adapter provides shared editing of graph data along with shared pointers and selection.

This project also forms the basis of the [mxGraph Graph Editor Demo](https://github.com/convergencelabs/mxgraph-demo).

## Installation

Install package with NPM and add it to your development dependencies:

```npm install --save-dev @convergence/mxgraph-adapter```

## Building

* `npm install`
* `npm run build`

## Run the Example

* `npm install`
* `npm run build`
* Update the configuration as described in `examples/config.example.js`.
* `npm start`
* Browse to `http://localost:4100`

## Usage

The following HTML creates a container element for mxGraph.

```html
<div id="mxgraph" style="height: 400px; width: 600px"></div>
```

The following JavaScript code will initialze a collaborative graph.

```JavaScript
const {
  ActivityColorManager,
  MxGraphAdapter,
  PointerManager,
  SelectionManager,
  Deserializer
} = ConvergenceMxGraphAdapter;

Convergence
  .connectAnonymously(CONVERGENCE_URL, "test user")
  .then(domain => {
    const model = domain
      .models()
      .openAutoCreate({
        id: "mxgrph-example",
        collection: "mxgraph",
        ephemeral: true,
        data: () => {
          return DEFAULT_GRAPH;
        }
      });
    const activity = domain
      .activities()
      .join("mxgraph-example");
    return Promise.all([model, activity]);
  })
  .then(([model, activity]) => {
    const container = document.getElementById("mxgraph");

    const graphModel = Deserializer.deserializeMxGraphModel(model.root().value());
    const graph = new mxGraph(container, graphModel);
    setTimeout(() => {
      const colorManger = new ActivityColorManager(activity);
      const graphAdapter = new MxGraphAdapter(graph, model.root());
      const pointerManager = new PointerManager(graph, activity, colorManger);
      const selectionManager = new SelectionManager(graph, activity, colorManger, graphAdapter);
    }, 0)
  });
```
