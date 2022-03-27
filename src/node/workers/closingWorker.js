const { parentPort } = require("worker_threads");
const {sleep} = require("../../utils");
//
parentPort.addListener("message", async ({ signal, port }) => {

    await sleep(2000);
    port.postMessage({ result: "ok" });
    port.close();
    // Change the value of signal[0] to 1
    Atomics.store(signal, 0, 1);
    // This will unlock the main thread when we notify it
    Atomics.notify(signal, 0);
});