import React from "react";
import SelectInput from "ink-select-input";
import degit from "degit";
import { resolve } from "path";

const items = [
  {
    label: "aquarium",
    value: "pmndrs/examples/demos/aquarium",
  },
  {
    label: "basic-demo",
    value: "pmndrs/examples/demos/basic-demo",
  },
  {
    label: "clouds",
    value: "pmndrs/examples/demos/clouds",
  },
];
type Item = (typeof items)[number];

export default function App({ dst = "." }: { dst?: string }) {
  const handleSelect = async ({ value: repository }: Item) => {
    const emitter = degit(repository, {
      // cache: true,
      // force: true,
      verbose: true,
    });
    emitter.on("info", (info) => {
      console.log(info.message);
    });

    await emitter.clone(resolve(dst));
    console.log(`Now, run: cd ${dst} && npm i && npm run dev`);
    process.exit(0);
  };

  return <SelectInput items={items} onSelect={handleSelect} />;
}
