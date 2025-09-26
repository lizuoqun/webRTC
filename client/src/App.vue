<script setup lang="ts">
import { io, Socket } from "socket.io-client";
import { onMounted, ref } from "vue";

const roomId = "room1";

const socket: Socket = io("http://localhost:3000");

// 发起方
const caller = ref<boolean>(false)
// 接收方
const called = ref<boolean>(false)
// 呼叫中
const calling = ref<boolean>(false)
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
})

const call = async () => {
  console.log("call");
  caller.value = true
  calling.value = true
  await getLocalStream()
  socket.emit("call", roomId)
};

const localVideo = ref()

const getLocalStream = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  if (localVideo.value) {
    localVideo.value.srcObject = stream;
    localVideo.value.play();
  }
  return stream
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <video ref="localVideo" class="w-1/4 h-1/2"></video>
    <div class="mt-4">
      <div v-if="caller && calling">呼叫中，等待对方接听</div>
      <div v-if="called && calling">
        <div>xx呼叫，是否接听？</div>
        <el-button type="primary" @click="calling = false">接听</el-button>
        <el-button type="danger" @click="calling = false">拒绝</el-button>
      </div>
    </div>
    <div class="mt-4">
      <el-button type="primary" @click="call">发起视频</el-button>
    </div>
  </div>
</template>
