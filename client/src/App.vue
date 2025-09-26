<script setup lang="ts">
import { io, Socket } from "socket.io-client";
import { onMounted, ref } from "vue";

const roomId = "room1";

const socket: Socket = io("http://localhost:3000");

const peer = ref<RTCPeerConnection | null>(null)

const localStream = ref<MediaStream | null>(null)

// 发起方
const caller = ref<boolean>(false)
// 接收方
const called = ref<boolean>(false)
// 呼叫中
const calling = ref<boolean>(false)
// 通话中
const communicating = ref<boolean>(false)
onMounted(() => {
  socket.on("connect", () => {
    console.log("Connected to server");
  })

  socket.on("connectionSuccess", () => {
    console.log("connectionSuccess from server");
    socket.emit("joinRoom", roomId);
  });

  socket.on("call", () => {
    if (!caller.value) {
      called.value = true
      calling.value = true
    }
  });

  socket.on("acceptCall", async () => {
    if (caller.value) {
      // 创建peer
      peer.value = new RTCPeerConnection()
      if (peer.value && localStream.value) {
        // @ts-ignore 添加视频流到peer
        peer.value.addStream(localStream.value as MediaStream)

        // 监听onicecandidate事件
        peer.value.onicecandidate = (event) => {
          // console.log('onicecandidate', event.candidate)
          if (event.candidate) {
            socket.emit("sendIceCandidate", { roomId, candidate: event.candidate })
          }
        }

        // @ts-ignore 监听onaddstream获取对方的视频流
        peer.value.onaddstream = (event) => {
          calling.value = false
          communicating.value = true
          remoteVideo.value!.srcObject = event.stream
          remoteVideo.value!.play()
        }

        // 创建Offer并且发送
        const offer = await peer.value.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        })

        // 在本地设置offer
        await peer.value.setLocalDescription(offer)

        socket.emit("sendOffer", { roomId, offer })

        console.log("offer", offer)
      }
    }
  });

  socket.on("refuseCall", () => {
    if (caller.value) {
      calling.value = false
      caller.value = false
      if (localVideo.value) {
        localVideo.value.srcObject = null;
      }
    }
  });

  socket.on("sendOffer", async (offer) => {
    // 在接收端做操作
    if (called.value) {
      console.log("receive offer", offer)
      peer.value = new RTCPeerConnection()
      if (peer.value) {
        const stream = await getLocalStream()
        // @ts-ignore 添加视频流到peer
        peer.value.addStream(stream as MediaStream)

        // 监听onicecandidate事件
        peer.value.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("sendIceCandidate", { roomId, candidate: event.candidate })
          }
        }

        // @ts-ignore 监听onaddstream获取对方的视频流
        peer.value.onaddstream = (event) => {
          calling.value = false
          communicating.value = true
          remoteVideo.value!.srcObject = event.stream
          remoteVideo.value!.play()
        }

        // 设置远程描述信息 SDP
        await peer.value.setRemoteDescription(offer)
        // 生成answer
        const answer = await peer.value.createAnswer()
        console.log("answer", answer)
        // 在本地设置answer
        await peer.value.setLocalDescription(answer)
        // 发送answer给对方
        socket.emit("sendAnswer", { roomId, answer })
      }
    }
  });

  // 接收Answer
  socket.on("sendAnswer", async (answer) => {
    // 在发送端做操作
    if (caller.value) {
      console.log("receive answer", answer)
      if (peer.value) {
        // 设置远程描述信息 SDP
        await peer.value.setRemoteDescription(answer)
      }
    }
  })

  // 收到
  socket.on("sendIceCandidate", async (candidate) => {
    if (peer.value) {
      await peer.value.addIceCandidate(candidate)
    }
  })
})

// 发起视频
const call = async () => {
  console.log("call");
  caller.value = true
  calling.value = true
  await getLocalStream()
  socket.emit("call", roomId)
};

const localVideo = ref()
const remoteVideo = ref()

const getLocalStream = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  if (localVideo.value) {
    localVideo.value.srcObject = stream;
    localVideo.value.play();
  }

  localStream.value = stream
  return stream
}

// 接听
const acceptCall = async () => {
  socket.emit("acceptCall", roomId)
}

const refuseCall = () => {
  socket.emit("refuseCall", roomId)
  calling.value = false
}

</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <div class="flex">
      <video ref="localVideo" class="h-auto min-h-80 bg-gray-300"></video>
      <video ref="remoteVideo" class="h-[100px] w-[100px] bg-blue-300 relative ml-[-100px]"></video>
    </div>


    <div class="mt-4">
      <div v-if="caller && calling">
        <div>呼叫中，等待对方接听</div>
        <div class="flex items-center justify-center">
          <div class="image hung-up" @click="calling = false"></div>
        </div>
      </div>
      <div v-if="called && calling">
        <div>xx呼叫，是否接听？</div>
        <div class="flex items-center justify-between">
          <div class="image answer" @click="acceptCall"></div>
          <div class="image hung-up" @click="refuseCall"></div>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <el-button type="primary" @click="call">发起视频</el-button>
    </div>
  </div>
</template>
<style scoped>
.image {
  width: 48px;
  height: 48px;
}

.answer {
  background-image: url("./answer.png");
  background-size: cover;
}

.hung-up {
  background-image: url("./hang-up.png");
  background-size: cover;
}
</style>