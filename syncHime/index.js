document.addEventListener("DOMContentLoaded", async function () {
  const PeerConnection =
    window.RTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection;
  !PeerConnection && message.error("浏览器不支持WebRTC！");

  // https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
  const iceServers = [
    {
      url: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
    {
      url: "turn:192.158.29.39:3478?transport=udp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      url: "turn:192.158.29.39:3478?transport=tcp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      url: "turn:turn.bistri.com:80",
      credential: "homeo",
      username: "homeo",
    },
    {
      url: "turn:turn.anyfirewall.com:443?transport=tcp",
      credential: "webrtc",
      username: "webrtc",
    },
    {
      url: "stun:stun.l.google.com:19302",
    },
  ];
  let isHost = false;
  let globleTarget = "";
  let video;
  if (location.href.match("bilibili"))
    video = document.querySelector(".bilibili-player-video video");
  if (location.href.match("youtube"))
    video = document.querySelector(".ytd-player video");
  const messageBox = document.querySelector("#message-box");
  const connectWindow = document.querySelector("#connect-window");
  const start = document.querySelector("#start-button");
  const send = document.querySelector("#send");
  const sendInput = document.querySelector("#send-input");
  const sync = document.querySelector("#sync");
  const targetInput = document.querySelector("#target-input");
  const close = document.querySelector("#close");

  let stateMe = document.querySelector("#state-me");
  let stateThey = document.querySelector("#state-they");

  let currentTimeMe = document.querySelector("#currentTime-me");
  let currentTimeThey = document.querySelector("#currentTime-they");

  let result = await storageGet(["websocket", "connectionType"]);
  console.log(result);
  let websocketUrl = result.websocket || "synchime.herokuapp.com";
  let connectType = result.connectionType || "webrtc";

  connectWindow.ondblclick = () => {
    if (!connectWindow.className) connectWindow.className = "shrink";
    else connectWindow.className = "";
  };
  makeItDraggable(connectWindow);
  sync.onclick = () => {
    let obj = {
      type: "offerSync",
    };
    sendConnectionMessage(obj);
    pushMessage("请求同步", "sys");
  };
  setState("未连接", "me");
  setState("未连接", "they");

  start.onclick = (e) => {
    startConnection();
  };
  send.onclick = (e) => {
    sendMessage();
  };
  sendInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  close.onclick = (e) => {
    resetConnection();
  };
  function sendMessage() {
    let msg = sendInput.value;
    if (!msg) return;
    let obj = {
      type: "msg",
      message: msg,
      timestamp: new Date(),
    };
    sendConnectionMessage(obj);
    pushMessage("你：" + msg);
    sendInput.value = "";
  }

  const socket = io("wss://" + websocketUrl + "/");
  pushMessage("websocket 开始连接", "sys");
  socket.on("connect", () => {
    pushMessage("websocket 连接成功", "sys");
    document.querySelector("#socket-id").value = socket.id;
  });
  socket.on("disconnect", (reason) => {
    pushMessage("websocket 连接断开：" + reason, "sys");
    if (reason === "io server disconnect") {
      // the disconnection was initiated by the server, you need to reconnect manually
      socket.connect();
    }
    // else the socket will automatically try to reconnect
  });
  socket.on("message", (data) => {
    const { type, sdp, iceCandidate, from: target } = data;
    globleTarget = target;
    if (type === "answer") {
      peer.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
    } else if (type === "answer_ice") {
      peer.addIceCandidate(iceCandidate);
    } else if (type === "offer") {
      startConnection(new RTCSessionDescription({ type, sdp }));
    } else if (type === "offer_ice") {
      peer.addIceCandidate(iceCandidate);
    }
    if (connectType === "websocket") {
      if (type === "timeupdate") setTime(data.currentTime, "they");
      else if (type === "stateupdate") setState(data.state, "they");
      else if (type === "offerSync") {
        pushMessage("对方请求同步", "sys");
        let obj = {
          type: "answerSync",
          currentTime: video.currentTime,
        };
        sendConnectionMessage(obj);
      } else if (type === "answerSync") {
        pushMessage("同步完成：" + data.currentTime, "sys");
        video.currentTime = data.currentTime;
      } else if (type === "msg") {
        if (connectWindow.className === "shrink") {
          chrome.runtime.sendMessage({ type: "notify", msg: data.message });
        }
        pushMessage("TA：" + data.message);
      }
    }
  });

  function resetConnection() {
    isHost = false;
    peer.restartIce();
    dc.close();
  }

  async function startConnection(offerSdp) {
    if (!offerSdp) {
      isHost = true;
      globleTarget = targetInput.value;
      const offer = await peer.createOffer({
        iceRestart: true,
      });
      pushMessage("createOffer", "sys");
      await peer.setLocalDescription(offer);
      pushMessage("setLocalDescription", "sys");
      socket.send({
        type: offer.type,
        sdp: offer.sdp,
        to: globleTarget,
        from: socket.id,
      });
    } else {
      await peer.setRemoteDescription(offerSdp);
      pushMessage("setRemoteDescription", "sys");
      const answer = await peer.createAnswer();
      pushMessage("createAnswer", "sys");
      socket.send({
        type: answer.type,
        sdp: answer.sdp,
        to: globleTarget,
        from: socket.id,
      });
      await peer.setLocalDescription(answer);
    }
  }

  const peer = new PeerConnection({
    iceServers,
  });

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      pushMessage("search candidate", "sys");
      socket.emit("message", {
        type: `${isHost ? "offer" : "answer"}_ice`,
        iceCandidate: e.candidate,
        to: globleTarget || targetInput.value,
        from: socket.id,
      });
    } else {
      pushMessage("search complete", "sys");
    }
  };
  var dc = peer.createDataChannel("my channel");

  dc.onclose = function () {
    pushMessage("连接已断开", "sys");
  };

  peer.ondatachannel = function (ev) {
    console.log("Data channel is created!");
    ev.channel.onopen = function () {
      pushMessage("已连接", "sys");
      setState("已连接", "me");
      setState("已连接", "they");
      console.log("Data channel is open and ready to be used.");
    };
    ev.channel.onmessage = function (e) {
      let data = JSON.parse(e.data);

      if (data.type === "timeupdate") setTime(data.currentTime, "they");
      else if (data.type === "stateupdate") setState(data.state, "they");
      else if (data.type === "offerSync") {
        pushMessage("对方请求同步", "sys");
        let obj = {
          type: "answerSync",
          currentTime: video.currentTime,
        };
        sendConnectionMessage(obj);
      } else if (data.type === "answerSync") {
        pushMessage("同步完成：" + data.currentTime, "sys");
        video.currentTime = data.currentTime;
      } else {
        if (connectWindow.className === "shrink") {
          chrome.runtime.sendMessage({ type: "notify", msg: data.message });
        }
        pushMessage("TA：" + data.message);
      }
    };
  };

  function pushMessage(msg, type) {
    var el = document.createElement("p");
    if (type) el.className = type;
    var txtNode = document.createTextNode(msg);
    el.appendChild(txtNode);
    messageBox.appendChild(el);
    messageBox.scrollTop = 9999999;
  }

  function setTime(time, type) {
    let min = Math.floor(time / 60);
    let sec = Math.floor(time % 60);
    if (sec < 10) sec = "0" + sec;
    if (type === "they") {
      currentTimeThey.innerText = min + ":" + sec;
    } else {
      currentTimeMe.innerText = min + ":" + sec;
    }
  }

  function setState(state, type) {
    if (type === "they") {
      stateThey.innerText = state;
    } else {
      stateMe.innerText = state;
    }
  }

  videoControlInit();
  function videoControlInit() {
    let lastTime = 0;
    video.ontimeupdate = (e) => {
      let currentTime = e.srcElement.currentTime;
      if (Math.abs(lastTime - currentTime) > 5) {
        lastTime = currentTime;
        let obj = {
          type: "timeupdate",
          currentTime,
        };
        sendConnectionMessage(obj);
        setTime(currentTime, "me");
      }
    };
    video.onpause = (e) => {
      let obj = {
        type: "stateupdate",
        state: "暂停",
      };
      sendConnectionMessage(obj);
      setState("暂停", "me");
    };
    video.onplay = (e) => {
      let obj = {
        type: "stateupdate",
        state: "播放",
      };
      sendConnectionMessage(obj);
      setState("播放", "me");
    };
  }

  function sendConnectionMessage(obj) {
    if (connectType === "websocket") {
      socket.send({
        ...obj,
        to: globleTarget,
        from: socket.id,
      });
    } else {
      dc.send(JSON.stringify(obj));
    }
  }
});

function makeItDraggable(el) {
  let dragged = false;
  let style = getComputedStyle(el);
  el.style.bottom = style.bottom;
  el.style.right = style.right;
  el.onmousedown = (e) => {
    dragged = true;
  };
  window.onmousemove = (e) => {
    if (!dragged) return;
    el.style.bottom = parseFloat(el.style.bottom) - e.movementY + "px";
    el.style.right = parseFloat(el.style.right) - e.movementX + "px";
  };

  window.onmouseup = (e) => {
    dragged = false;
  };
}

function storageGet(key) {
  return new Promise((resolve, reject) => {
    // key sample ['websocket']
    chrome.storage.sync.get(key, function (result) {
      resolve(result);
    });
  });
}
