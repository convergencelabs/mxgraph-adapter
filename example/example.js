const {
  ActivityColorManager,
  MxGraphAdapter,
  PointerManager,
  SelectionManager,
  Deserializer
} = ConvergenceMxGraphAdapter;


async function run() {
  const domain = await Convergence.connectAnonymously(CONVERGENCE_URL, "test user");

  const model = await domain
      .models()
      .openAutoCreate({
        id: "mxgrph-example",
        collection: "mxgraph",
        ephemeral: true,
        data: () => {
          return DEFAULT_GRAPH;
        }
      });

  const options = {autoCreate: {ephemeral: true, worldPermissions: ["join", "view_state", "set_state"]}};
  const activity = await domain
      .activities()
      .join("mxgraph-example", "example", options);

  const container = document.getElementById("mxgraph");

  const graphModel = Deserializer.deserializeMxGraphModel(model.root().value());
  const graph = new mxGraph(container, graphModel);
  setTimeout(() => {
    const colorManger = new ActivityColorManager(activity);
    const graphAdapter = new MxGraphAdapter(graph, model.root());
    const pointerManager = new PointerManager(graph, activity, colorManger);
    const selectionManager = new SelectionManager(graph, activity, colorManger, graphAdapter);
  }, 0);
}

run().catch(e => console.log(e));