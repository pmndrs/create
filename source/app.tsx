import React from "react";
import SelectInput from "ink-select-input";
import degit from "degit";

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

export default function App({ name }: { name?: string }) {
  console.log(name);

  const handleSelect = async ({ value: repository }: Item) => {
    console.log(`Selected: ${repository}`);

    const emitter = degit(repository, {
      // cache: true,
      // force: true,
      // verbose: true,
    });
    emitter.on("info", (info) => {
      console.log(info.message);
    });

    await emitter.clone(process.cwd());
  };

  return <SelectInput items={items} onSelect={handleSelect} />;
}
