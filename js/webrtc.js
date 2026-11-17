let localStream = null;
let peer = null;
let currentRoomId = null;
let isFocusLocked = false;
let userMicPreference = true;
let userCamPreference = true;

async function initWebRTCAndRoom() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("local-video").srcObject = localStream;
  } catch (err) {
    alert("Camera/Mic permission denied or unavailable. You can still use the synced timer!");
  }

  // Check if user opened an invite link (?room=XYZ)
  const urlParams = new URLSearchParams(window.location.search);
  const invitedRoom = urlParams.get("room");
  currentRoomId = invitedRoom || "room-" + Math.random().toString(36).substring(2, 8);

  document.getElementById("current-room-id").textContent = currentRoomId;
  connectToRealtimeRoom(currentRoomId);
  initPeerConnection();
}

function initPeerConnection() {
  peer = new Peer();

  peer.on("open", (myPeerId) => {
    // Announce our PeerJS ID to everyone in the Supabase room
    roomChannel.send({
      type: "broadcast",
      event: "peer-joined",
      payload: { peerId: myPeerId }
    });
  });

  // Answer incoming calls from friends
  peer.on("call", (call) => {
    call.answer(localStream);
    call.on("stream", (remoteStream) => addRemoteVideo(call.peer, remoteStream));
  });
}

function callFriendPeer(friendPeerId) {
  if (!peer || !localStream || friendPeerId === peer.id) return;
  const call = peer.call(friendPeerId, localStream);
  call.on("stream", (remoteStream) => addRemoteVideo(friendPeerId, remoteStream));
}

function addRemoteVideo(peerId, stream) {
  if (document.getElementById(`video-${peerId}`)) return;

  const wrapper = document.createElement("div");
  wrapper.className = "video-wrapper";
  wrapper.id = `video-${peerId}`;

  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;

  const overlay = document.createElement("div");
  overlay.className = `video-overlay ${isFocusLocked ? "active" : ""}`;
  overlay.innerHTML = "<span>🔒 Friend is Studying</span>";

  const tag = document.createElement("span");
  tag.className = "name-tag";
  tag.textContent = "Study Buddy";

  wrapper.append(video, overlay, tag);
  document.getElementById("video-grid").appendChild(wrapper);
}

// Automatically pause/resume Audio & Video based on Study vs Break state
function setStudyFocusMediaLock(locked) {
  isFocusLocked = locked;
  const badge = document.getElementById("av-status-badge");
  const overlays = document.querySelectorAll(".video-overlay");

  if (locked) {
    // Mute local mic and pause camera track
    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = false));
      localStream.getVideoTracks().forEach(t => (t.enabled = false));
    }
    badge.textContent = "Focus Mode: Cam/Mic Auto-Paused";
    badge.className = "status-pill focus";
    overlays.forEach(o => o.classList.add("active"));
  } else {
    // Restore user's mic and camera automatically on break!
    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = userMicPreference));
      localStream.getVideoTracks().forEach(t => (t.enabled = userCamPreference));
    }
    badge.textContent = "Break Mode: Cam/Mic Live";
    badge.className = "status-pill break";
    overlays.forEach(o => o.classList.remove("active"));
  }
}

function manualToggleMic() {
  if (isFocusLocked) return alert("Mic is auto-paused during Focus Time!");
  userMicPreference = !userMicPreference;
  if (localStream) localStream.getAudioTracks().forEach(t => (t.enabled = userMicPreference));
  document.getElementById("btn-toggle-mic").textContent = userMicPreference ? "🎤 Mic On" : "🔇 Mic Muted";
}

function manualToggleCam() {
  if (isFocusLocked) return alert("Camera is auto-paused during Focus Time!");
  userCamPreference = !userCamPreference;
  if (localStream) localStream.getVideoTracks().forEach(t => (t.enabled = userCamPreference));
  document.getElementById("btn-toggle-cam").textContent = userCamPreference ? "📷 Cam On" : "🚫 Cam Off";
}

function copyInviteLink() {
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
  navigator.clipboard.writeText(inviteUrl);
  alert("Invite link copied! Send it to your friends so they can join your room.");
}

function joinFriendRoom() {
  const input = document.getElementById("join-room-input").value.trim();
  if (!input) return;
  // Support pasting either full URL or raw Room ID
  const extractedId = input.includes("room=") ? input.split("room=")[1].split("&")[0] : input;
  window.location.href = `${window.location.origin}${window.location.pathname}?room=${extractedId}`;
}