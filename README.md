## 项目说明

这是一个基于 Vue3 和 TypeScript 构建的实时视频通信应用，采用现代前端技术栈实现 WebRTC 视频通话功能。项目通过 Socket.IO 实现实时通信，支持一对一视频通话，具备完整的呼叫流程控制和 WebRTC 信令交换机制。

### 目录结构概览

该项目采用典型的前后端分离架构设计，通过清晰的目录结构实现了客户端和服务端的独立开发和部署。整个项目包含四个主要目录：

```mermaid
graph TB
subgraph "项目根目录"
Root[webRTC项目根目录]
subgraph "前端客户端 (client/)"
ClientDir[client/]
ClientSrc[src/]
ClientPublic[index.html]
ClientConfig[vite.config.ts]
ClientPackage[package.json]
end
subgraph "后端服务端 (server/)"
ServerDir[server/]
ServerIndex[index.js]
ServerPackage[package.json]
end
subgraph "配置文件"
Readme[README.md]
end
end
Root --> ClientDir
Root --> ServerDir
Root --> Readme
ClientDir --> ClientSrc
ClientDir --> ClientPublic
ClientDir --> ClientConfig
ClientDir --> ClientPackage
ServerDir --> ServerIndex
ServerDir --> ServerPackage
```

### 整体架构图

```mermaid
graph LR
subgraph "客户端层"
Browser["浏览器"]
VueApp["Vue3应用"]
WebRTC["WebRTC API"]
SocketClient["Socket.IO Client"]
end
subgraph "网络层"
WebSocket["WebSocket连接"]
Signaling["信令服务器"]
end
subgraph "服务端层"
NodeServer["Node.js服务器"]
SocketServer["Socket.IO服务器"]
RoomManager["房间管理器"]
end
Browser --> VueApp
VueApp --> WebRTC
VueApp --> SocketClient
SocketClient --> WebSocket
WebSocket --> Signaling
Signaling --> SocketServer
SocketServer --> RoomManager
RoomManager --> NodeServer
```

### 客户端 Client

```bash
npm i
npm run dev
```

#### 客户端核心组件

```mermaid
classDiagram
class App {
+Socket socket
+RTCPeerConnection peer
+MediaStream localStream
+boolean caller
+boolean called
+boolean calling
+boolean communicating
+call() Promise~void~
+acceptCall() Promise~void~
+refuseCall() void
+getLocalStream() Promise~MediaStream~
}
class SocketIOClient {
+emit(event, data) void
+on(event, callback) void
+disconnect() void
}
class RTCPeerConnection {
+createOffer() Promise~RTCSessionDescription~
+createAnswer() Promise~RTCSessionDescription~
+setLocalDescription(desc) Promise~void~
+setRemoteDescription(desc) Promise~void~
+addIceCandidate(candidate) Promise~void~
+onicecandidate EventHandler
+onaddstream EventHandler
}
class MediaDevices {
+getUserMedia(constraints) Promise~MediaStream~
}
App --> SocketIOClient : "使用"
App --> RTCPeerConnection : "创建"
App --> MediaDevices : "调用"
RTCPeerConnection --> MediaDevices : "添加流"
```

### 服务端 Server

```bash
npm i
npm run start
```

#### 服务端核心组件

```mermaid
classDiagram
class SocketIOServer {
+io Socket
+on(event, callback) void
+to(roomId) BroadcastOperator
+emit(event, data) void
}
class RoomManager {
+join(roomId) void
+leave(roomId) void
+broadcast(event, data) void
}
class SignalingHandler {
+handleCall(roomId) void
+handleAccept(roomId) void
+handleRefuse(roomId) void
+handleOffer(data) void
+handleAnswer(data) void
+handleIceCandidate(data) void
}
SocketIOServer --> RoomManager : "管理"
SocketIOServer --> SignalingHandler : "处理"
RoomManager --> SignalingHandler : "广播"
```

### 用户操作到 Socket 事件的转化流程

```mermaid
sequenceDiagram
participant User as 用户
participant Vue as Vue组件
participant Socket as Socket.IO客户端
participant Server as Socket.IO服务器
participant Peer as RTCPeerConnection
User->>Vue : 点击"发起视频"
Vue->>Vue : call()方法
Vue->>Vue : 设置caller=true, calling=true
Vue->>Vue : getLocalStream()
Vue->>Socket : emit("call", roomId)
Socket->>Server : 转发call事件
Server->>Server : 广播给房间内其他用户
Server->>Socket : emit("call")
Socket->>Vue : 触发"call"事件
Vue->>Vue : called=true, calling=true
Vue->>Vue : acceptCall()或refuseCall()
Vue->>Socket : emit("acceptCall"/"refuseCall")
Socket->>Server : 转发相应事件
Server->>Socket : 广播给房间内其他用户
```

## 信令交换机制

```mermaid
sequenceDiagram
participant Client1 as 客户端1
participant Server as 信令服务器
participant Client2 as 客户端2
Client1->>Server : joinRoom(roomId)
Client2->>Server : joinRoom(roomId)
Client1->>Server : call(roomId)
Server->>Client2 : call()
Client2->>Server : acceptCall(roomId)
Server->>Client1 : acceptCall()
Client1->>Server : sendOffer({roomId, offer})
Server->>Client2 : sendOffer(offer)
Client2->>Server : sendAnswer({roomId, answer})
Server->>Client1 : sendAnswer(answer)
Client1->>Server : sendIceCandidate({roomId, candidate})
Server->>Client2 : sendIceCandidate(candidate)
Client2->>Server : sendIceCandidate({roomId, candidate})
Server->>Client1 : sendIceCandidate(candidate)
```

## 参考

[peer.js](https://peerjs.com/)
