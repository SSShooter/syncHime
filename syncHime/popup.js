const url = document.querySelector("#websocket-url");
const type = document.querySelector("#connection-type");

const save = document.querySelector("#save");
save.innerText = chrome.i18n.getMessage("save");

chrome.storage.sync.get(["websocket", "connectionType"], function (result) {
  url.value = result.websocket || "synchime.herokuapp.com";
  type.value = result.connectionType || "webrtc";
});
save.onclick = (e) => {
  chrome.storage.sync.set(
    { websocket: url.value, connectionType: type.value },
    function () {
      console.log("set");
      save.innerText = "已保存";
      setTimeout(() => {
        save.innerText = chrome.i18n.getMessage("save");
      }, 1000);
    }
  );
};
