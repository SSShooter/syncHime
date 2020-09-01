chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'notify')
    chrome.notifications.create(null, {
      type: "basic",
      iconUrl: "logo.png",
      title: "收到新信息",
      message: request.msg,
    });
});
