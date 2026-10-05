const test = async () => {
  const mod = await import("next/" + "headers");
  console.log(mod);
}
test();
