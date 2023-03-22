let APP_ID = "be8fd229f7ca4bba9ffd9bab89c19c7f";
let token = null;
let uid = String(Math.floor(Math.random() * 1000));

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

// setting up server
const server = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

let init = async () => {
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });

  channel = client.createChannel("main");
  await channel.join();

  channel.on("MemberJoined", handleUerJoined);
  client.on("MessageFromPeer", handleMessageFromPeer);
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  document.getElementById("user-1").srcObject = localStream;
  createOffer();
};

let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text);
  console.log("Message", message);
};

let handleUerJoined = async (MemberId) => {
  console.log("New User joined ", MemberId);
  createOffer(MemberId);
};

let createOffer = async (MemberId) => {
  peerConnection = new RTCPeerConnection(server);
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  // your data should reach remote user
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      console.log("New Ice", event.candidate);
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };
  // creating offer
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "offer", offer: offer }) },
    MemberId
  );
};

init();
