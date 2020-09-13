document.addEventListener("DOMContentLoaded", async function () {
  let send = chrome.runtime.getURL("icon/send.svg");
  let connect = chrome.runtime.getURL("icon/connect.svg");
  let disconnect = chrome.runtime.getURL("icon/disconnect.svg");
  let sync = chrome.runtime.getURL("icon/sync.svg");
  let div = document.createElement("div");
  div.setAttribute("id", "connect-window");
  div.innerHTML = `
  <div id="message-box"></div>
  <div id="message-sender">
    <input type="text" placeholder="发送内容" id="send-input" />
    <img title="send" class="svg-button" id="send" src="${send}" />
    <img title="sync" class="svg-button" id="sync" src="${sync}" />
  </div>
  <div>
  <div class="state">对方状态：<span id="state-they"></span><span id="currentTime-they"></span></div>
  <div class="state">我的状态：<span id="state-me"></span><span id="currentTime-me"></span></div>
  </div>
  <div id="connect-box">
    <input type="text" id="socket-id" />
    <input type="text" placeholder="连结对象" id="target-input" />
    <img title="connect" class="svg-button" id="start-button" src="${connect}" />
    <img title="disconnect" class="svg-button" id="close" src="${disconnect}" />
  </div>`;
  // document.querySelector('#app').appendChild(div)
  if (location.href.match("bilibili"))
    document.querySelector("#bilibiliPlayer").appendChild(div);
  if (location.href.match("youtube")) document.body.appendChild(div);
  if (location.href.match("iqiyi")) {
    await waitSec(2);
    document.querySelector(".iqp-player").appendChild(div);
  }
  // document.body.appendChild(div)
});

function waitSec(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, sec * 1000);
  });
}