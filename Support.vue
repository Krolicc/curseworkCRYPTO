<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from "pinia"

import requestHelper from "@/modules/requestHelper"

import { useBreakpointsStore } from "@/store/breakpoints"
import { useSupportStore } from "@/store/support"
import { useIndexStore } from "@/store"

import { ChatData, ContentType, Message, MessageType } from "@/services/types"
import { Algorithms, CipherMode, Paddings } from "@/types/state"

import SendArrow from "@/components/svg/SendArrow.vue"
import LiftArrow from "@/components/svg/LiftArrow.vue"

import Arrow from "@/components/svg/Arrow.vue"
import Cross from "@/components/svg/Cross.vue"
import Pin from "@/components/svg/Pin.vue"

import TripePoint from "@/components/svg/icon/TriplePoint.vue"
import Mode from "@/components/svg/icon/Mode.vue"
import Padding from "@/components/svg/icon/Padding.vue"
import ProgressSpinner from "@/components/svg/icon/Spinners/ProgressSpinner.vue"

// name: "Support"

const {
  messages,
  chatsData,
  GET_CUR_CHAT,
  GET_PROGRESS,
  GET_BRIEF_CONTENT_DETAILS,
} = storeToRefs(useSupportStore())

const { GET_USER_ID } = storeToRefs(useIndexStore())


const {
  loadMessagesFromInternalDb,
  importDatabaseFromFile,
  exportDatabaseToFile,

  loadChatsData,
  pinMedia,
  sendMessage,

  // ADD_MESSAGE,
  undo_content,
  SET_CUR_ROOM,
  SET_PADDING,
  SET_MODE,
  ADD_CHAT_DATA,
  REMOVE_CHAT_DATA,
} = useSupportStore();

const { inRange } = useBreakpointsStore()

// Data
const message = ref<string>("")
const chatMessages = ref<HTMLElement | null>(null)

const isBeingCreated_room = ref<boolean>(false)
const isAlgorithmChosen = ref<boolean>(false)
const isModeChosen = ref<boolean>(false)
const isPaddingChosen = ref<boolean>(false)
const isExtraActions = ref<boolean>(false)
const isBriefDetails = ref<boolean>(false)

const chat = reactive<ChatData>({
  name: "",
  algorithm: Algorithms.NONE
})

const fileInput = useTemplateRef<HTMLInputElement>("fileInput")

// Methods
const removeChat = async (room: any, event: any) => {
  event.stopPropagation()

  const url = `http://localhost:8000/api/v1/chat/${room.id}`
  const config = {
    headers: {
      Accept: 'application/json',
      "Content-Type": 'application/json',
    },
  }

  let { is_success } = await requestHelper.methods.action_delete(url, config, "removeChat", "No rooms removed")

  if (is_success) REMOVE_CHAT_DATA(room)
}

const createChat = async () => {
  const url = "http://localhost:8000/api/v1/chat/"
  let chatData = {
    name: chat.name,
    algorithm: chat.algorithm,
    status: "active",
    interlocutor_id: null,
  }

  const config = {
    headers: {
      Accept: 'application/json',
      "Content-Type": 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(chatData)
  }

  let { is_success, response } = await requestHelper.methods.action_post(url, config, "createChat", "No rooms created")

  if (is_success) {
    ADD_CHAT_DATA({ ...chat, id: response.id, mode: CipherMode.ECB, padding: Paddings.ZEROS })

    isBeingCreated_room.value = false
    isAlgorithmChosen.value = false

    Object.assign(chat, {
      name: "",
      algorithm: Algorithms.NONE
    })
  }
}

const downloadFile = (buffer: ArrayBuffer, fileName: string, mimeType: string) => {
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url

  a.download = fileName
  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const send = () => {
  const text = message.value.trim() || undefined

  sendMessage(text)

  // ADD_MESSAGE(newMessage).then(r => {
  //   message.value = ""
  //   nextTick(() => {
  //     if (chatMessages.value) {
  //       chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
  //     }
  //   })
  // })
}

const openFileSelection = () => {
  fileInput.value?.click();
}

watch(GET_CUR_CHAT.value, (new_data: any) => {
  console.log(new_data)
  loadMessagesFromInternalDb(new_data.id)
})

onMounted(async () => {
  // await initDb()
  await loadChatsData()
})
</script>

<template>
  <div class="container">
    <div v-if="inRange(null, 'lg') && !GET_CUR_CHAT || inRange('lg')" class="chat-nav">
      <button @click="isBeingCreated_room = !isBeingCreated_room">{{ isBeingCreated_room ? "CLOSE" : "NEW" }}</button>

      <form v-if="isBeingCreated_room" class="create_room_wrapper">
        <input type="text" name="" id=""
               v-model="chat.name"
               placeholder="Name"
               class="animated" />

        <div @click="isAlgorithmChosen = !isAlgorithmChosen" class="choose_alg_btn pointer">
          <span class="animated">{{ chat.algorithm === "None" ? "Algorithm" : chat.algorithm }}</span>

          <Arrow :settings="{ sizeCoef: 0.5 }" :direction="isAlgorithmChosen ? 'up' : 'down'" />

          <ul v-if="isAlgorithmChosen">
            <li v-for="alg in Object.values(Algorithms).reverse()" :key="alg"
                @click="chat.algorithm = alg"
                class="animated" :class="{ active: chat.algorithm === alg }"
            >
              {{ alg == Algorithms.NONE ? '-' : alg }}
            </li>
          </ul>
        </div>

        <button @click.prevent="createChat" type="submit" class="pointer">
          <SendArrow />
        </button>
      </form>

      <ul>
        <li v-for="(room, idx) in chatsData" :key="idx"
            @click="SET_CUR_ROOM(room)"
            class="animated"
        >
          <button @click="removeChat(room, $event)" class="btn del_chat">
            <Cross />
          </button>

          <span class="name animated">{{ room.name }}</span>
          <span class="lastMessage animated">{{ room.lastMessage ?? 'No message' }}</span>
        </li>
      </ul>
    </div>

    <div v-if="inRange('lg') || GET_CUR_CHAT" class="chat_container">
      <div v-if="!GET_CUR_CHAT" class="chat_container-block_wrapper">
        <div class="warning_block">
          CHOOSE A CHAT
        </div>
      </div>

      <div class="chat_container-header">
        <span>{{ GET_CUR_CHAT ? GET_CUR_CHAT.name : 'DEFAULT' }}</span>

        <button @click="isExtraActions = !isExtraActions" class="extra_actions btn pointer">
          <TripePoint />
        </button>

        <ul v-if="isExtraActions && GET_CUR_CHAT" class="extra_action-list">
          <li @click="exportDatabaseToFile">
            <LiftArrow />
            Export Chat
          </li>
          <li @click="openFileSelection">
            <LiftArrow direction="down"/>
            Import Chat
          </li>
          <li @click="isModeChosen = !isModeChosen">
            <Mode /> Change Mode

            <ul v-if="isModeChosen" class="modes_list">
              <li v-for="mode in Object.values(CipherMode)" :key="mode"
                  @click.stop="SET_MODE(mode)"
                  class="animated" :class="{ active: GET_CUR_CHAT.mode === mode }"
              >
                {{ mode }}
              </li>
            </ul>
          </li>
          <li @click="isPaddingChosen = !isPaddingChosen">
            <Padding /> Change Padding

            <ul v-if="isPaddingChosen" class="paddings_list">
              <li v-for="padding in Object.values(Paddings)" :key="padding"
                  @click.stop="SET_PADDING(padding)"
                  class="animated" :class="{ active: GET_CUR_CHAT.padding === padding }"
              >
                {{ padding }}
              </li>
            </ul>
          </li>
        </ul>

      </div>

      <ul ref="chatMessages" class="messages">
        <li v-for="(mes, idx) in messages" :key="'message_' + idx"
            :class="[mes.affiliation ? 'self-end' : 'self-start']"
        >
          <ul v-for="(content, c_idx) in mes.contents" :key="'content_' + idx + '_' + c_idx "
              class="contents_wrapper"
          >
            <li @click="downloadFile(content.data, content.name, content.type)"
                class="content"
            >{{ content.name }}</li>
          </ul>

          <span v-if="mes.text">
            {{ mes.text }}
          </span>
        </li>
      </ul>

<!--      !get_chosenData && get_chosenData.id < 1-->
      <div class="input-area">
        <button @click="pinMedia" class="pinMedia">
          <Pin :settings="{ sizeCoef: 1}" />
        </button>
        <input type="text" placeholder="Write a message..." v-model="message"
               @keyup.enter="send"
               class="animated"
               :disabled="false">
        <div class="spinner">
          <table v-if="isBriefDetails" class="brief_details">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Status</th>
                <th>Percent</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="([ datestamp, mes ], mes_idx) in Object.entries(GET_BRIEF_CONTENT_DETAILS)" :key="'message_brief_content_' + mes_idx">
                <tr v-for="(content, cnt_idx) in mes.details" :key="'content_' + cnt_idx">
                  <td>{{ content.name }}</td>
                  <td>{{ content.sent === 0 ? 'ENCRYPTING' : "SENDING"}}</td>
                  <td>{{ Math.round((content.sent === 0 ? content.encrypted : content.sent) / content.blockCount * 100) }}</td>
                  <td @click="undo_content(datestamp, cnt_idx, content.sent === 0)" class="undo_message"><Cross /></td>
                </tr>
              </template>
            </tbody>
          </table>

          <ProgressSpinner
            @click.stop="isBriefDetails = !isBriefDetails"
            :percent="GET_PROGRESS.empty ? 100 : GET_PROGRESS.progress_total" />
        </div>
        <button @click="send" class="sendMessage" :disabled="false">
          <SendArrow :settings="{sizeCoef: 1}" />
        </button>
      </div>
    </div>
  </div>

  <input type="file" accept=".json"
         ref="fileInput" id="fileInput" @change="importDatabaseFromFile"
         style="display: none;"
  />
</template>

<style scoped lang="sass">
.container
  @include display-flex(row, center, start, nowrap)
  column-gap: 50px

  padding-top: 25px
  height: 100%

  .chat-nav
    @include display-flex(column, start, center, nowrap)
    row-gap: 20px
    width: 250px

    > button
      @include display-flex(row, center, center, nowrap)
      @include size(60px, 100%)

      border: none
      border-radius: $borderRadius
      box-shadow: 0 10px 30px 0 $content_gray_half

      color: $content_gray
      font-weight: 600
      font-size: 1.5rem
      letter-spacing: 1px

      &:hover
        box-shadow: 0 10px 20px 0 $main_half
        color: $main

    .create_room_wrapper
      display: grid
      grid-template-areas: "Name Name" "Algorithm Send"
      grid-template-columns: auto 45px
      grid-template-rows: 45px 45px
      gap: 20px

      input
        grid-area: Name

        background-color: $Lgray
        border-radius: $borderRadius
        box-shadow: 0 10px 30px 0 $content_gray
        box-sizing: border-box
        border: none
        outline: none

        padding: .75rem 1rem
        margin: 0

        &::placeholder
          color: $content_gray

        &:hover,
        &:focus
          color: $main

      .choose_alg_btn
        grid-area: Algorithm

      .choose_alg_btn
        @include display-flex(row, space-between, center, nowrap)
        --svg-stroke-color: var(--content-gray)
        --svg-stroke-width: 4

        background-color: $Lgray
        border-radius: $borderRadius
        box-shadow: 0 10px 30px 0 $content_gray
        box-sizing: border-box

        color: $content_gray

        position: relative

        padding: .75rem 1rem

        &:hover
          --svg-stroke-color: var(--main)

          span
            color: $main

        ul
          @include display-flex(column, center, center, null)

          background-color: $Lgray
          border-radius: $borderRadius
          box-shadow: 0 10px 30px 0 $content_gray
          box-sizing: border-box
          list-style-type: none

          position: absolute
          bottom: -10px
          left: 0
          transform: translateY(100%)
          z-index: 10

          width: 100%

          li
            box-sizing: border-box

            padding: .75rem 1rem
            width: 100%

            &.active,
            &:hover
              color: $main

      button
        grid-area: Send

        @include display-flex(none, center, center, none)
        --svg-fill-color: var(--l-gray)
        --svg-stroke-color: var(--l-gray)

        background-color: $main
        border-radius: $borderRadius
        border: none
        outline: none

    > ul
      @include display-flex(column, center, start, nowrap)
      row-gap: 20px
      list-style: none
      width: 100%

      li
        --svg-fill-color: var(--l-gray)

        @include display-flex(column, center, start, nowrap)
        @include size(90px, 100%)
        row-gap: 3px

        border-radius: $borderRadius
        box-sizing: border-box
        box-shadow: 0 10px 30px 0 $content_gray_half
        cursor: pointer

        color: $content_gray
        letter-spacing: 1px
        font-weight: 600

        position: relative

        padding: 16px 15px

        &:hover
          --svg-fill-color: var(--main)

          box-shadow: 0 10px 20px 0 $main_half
          color: $main

        .name
          font-size: 1.5rem

        .lastMessage
          -webkit-box-orient: vertical
          -webkit-line-clamp: 1

          display: -webkit-box
          text-overflow: ellipsis
          overflow: hidden
          height: 1.25rem

        .btn.del_chat
          border: none

          position: absolute
          top: 25%
          right: 4px
          transform: translateY(-50%)

          padding: .25rem .5rem

.chat_container
  flex-grow: 1

  border-radius: $borderRadius
  box-shadow: 0 10px 30px 0 $content_gray_half inset
  box-sizing: border-box

  display: flex
  flex-direction: column
  align-items: center
  justify-content: start

  position: relative

  padding: 1rem
  height: 90%

  &-block_wrapper
    @include display-flex(null, center, center, null)
    @include size(calc(100% + 20px), calc(100% + 20px))

    backdrop-filter: blur(5px)

    position: absolute
    top: -10px
    left: -10px
    z-index: 10

    .warning_block
      background-color: $Lgray
      border-radius: $borderRadius
      box-shadow: 0 10px 30px 0 $content_gray

      color: $content_gray
      font-weight: 600
      letter-spacing: 1px

      padding: 2rem 4rem

  &-header
    @include display-flex(row, space-between, center, nowrap)

    background-color: $Lgray
    border-radius: $borderRadius
    box-sizing: border-box
    box-shadow: 0 10px 30px 0 $content_gray_half

    position: relative

    padding: 1rem 1.5rem
    width: 100%
    height: 91px

    span
      color: $content_gray
      font-size: 1.5rem
      font-weight: 600
      letter-spacing: 1px

    .btn.extra_actions
      --svg-fill-color: var(--content-gray)

      border: none
      outline: none

      transform: translateX(.75rem)

      padding: .5rem 1.5rem

    .extra_action-list
      @include display-flex(column, start, start, nowrap)

      background-color: $Lgray
      border-radius: $borderRadius
      box-shadow: 0 10px 30px 0 $content_gray_half
      list-style: none

      color: $content_gray

      position: absolute
      bottom: -10px
      right: 0
      transform: translateY(100%)

      > li
        --svg-fill-color: var(--content-gray)
        --svg-stroke-color: var(--content-gray)

        @include display-flex(row, start, center, nowrap)
        column-gap: 10px
        box-sizing: border-box
        cursor: pointer

        position: relative

        padding: 0.5rem 0.75rem

        &:hover
          --svg-fill-color: var(--main)
          --svg-stroke-color: var(--main)

        ul
          @include display-flex(column, center, center, null)

          background-color: $Lgray
          border-radius: $borderRadius
          box-shadow: 0 10px 30px 0 $content_gray
          box-sizing: border-box
          list-style-type: none

          position: absolute
          top: 0
          left: -10px
          transform: translateX(-100%)
          z-index: 10

          width: 100%

          li
            box-sizing: border-box

            padding: .75rem 1rem
            width: 100%

            &.active,
            &:hover
              color: $main

.messages
  list-style: none
  box-sizing: border-box

  display: flex
  flex-grow: 1
  flex-direction: column
  justify-content: end
  gap: 0.5rem

  position: static
  overflow-y: auto

  padding: 1em
  width: 100%

  &::-webkit-scrollbar
    display: none
  -ms-overflow-style: none
  scrollbar-width: none

  > li
    border-radius: $borderRadius
    word-wrap: break-word
    max-width: 80%

    &.self-start
      background-color: #e5e7eb
      color: #1f2937
      align-self: flex-start

      span
        background-color: var(--gg-dark-green)

        .content
          background-color: var(--gg-dark-green)


    &.self-end
      align-self: flex-end

      span
        background-color: $main

      .content
        background-color: $main

    span
      color: $Lgray
      padding: .5rem 1.5rem

    .contents_wrapper
      @include display-flex(row, center, start, wrap)
      gap: 10px

      max-width: 210px

      .content
        @include display-flex(null, center, center, null)
        @include size(80px, 60px)

        border-radius: $borderRadius
        box-sizing: border-box
        cursor: pointer

        color: $Lgray
        font-size: 0.75rem
        font-weight: 500
        text-align: center

        padding: .5rem 1.5rem

.input-area
  display: flex
  align-items: center
  flex-direction: row
  justify-content: center

  background-color: $Lgray
  border-radius: $borderRadius
  box-shadow: 0 10px 30px 0 $content_gray_half

  width: 100%

  .pinMedia
    --svg-fill-color: var(--content-gray)
    --svg-stroke-color: var(--content-gray)

    border: none
    cursor: pointer
    padding: 0.75rem
    padding-left: 1rem

    &:hover
      --svg-fill-color: var(--main)
      --svg-stroke-color: var(--main)

  input
    border: none
    outline: none

    color: $main

    padding: 0.75rem 1rem
    margin: 0

    &::placeholder
      color: $content_gray

  .spinner
    --svg-stroke-color: var(--content-gray)

    cursor: pointer

    position: relative

    padding: 0.75rem .5rem

    &:hover
      --svg-stroke-color: var(--main)

    .brief_details
      background-color: $Lgray
      border-radius: $borderRadius
      box-shadow: 0 10px 30px 0 $content_gray_half
      color: $content_gray

      position: absolute
      top: -10px
      right: 0
      transform: translateY(-100%)

      tr
        position: relative

        td:not(.undo_message), th
          padding: .5rem 1.5rem
          text-align: center

        .undo_message
          --svg-fill-color: #B56D6D

          @include display-flex(null, center, center, null)

          opacity: 0

          position: absolute
          left: 0
          top: 0
          transform: translateX(-100%)

          height: 100%
          padding-inline: 1rem

        &:hover > .undo_message
          opacity: 1

  .sendMessage
    --svg-fill-color: var(--main)
    --svg-stroke-color: var(--main)

    @include display-flex(null, center, center, null)

    border: none
    cursor: pointer
    padding: 0.75rem 1rem

.actions
  display: flex
  flex-direction: column
  row-gap: 20px

  position: fixed
  bottom: 2rem
  right: 2rem
  z-index: 50

  .create-room
    background-color: $main
    border-radius: $borderRadius
    border: none
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2)
    cursor: pointer

    color: $Lgray
    font-weight: bold

    padding: 0.75rem 1.5rem

    transition: background-color 0.3s ease-in-out, transform 0.1s ease-in-out

    &:hover
      background-color: #16a34a /* Tailwind green-600 */
      transform: translateY(-2px)

    &:active
      transform: translateY(0)
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)

/* Медиа-запросы для адаптивного дизайна */
@media (max-width: 768px)
  .chat-container
    /* На мобильных устройствах делаем контейнер шире */
    width: 95%
    margin: 1rem auto
    padding: 1rem

  .messages li
    /* На мобильных устройствах сообщения могут быть немного шире */
    max-width: 90%

  button.fixed
    /* На мобильных устройствах кнопка может быть чуть меньше */
    bottom: 1rem
    right: 1rem
    padding: 0.6rem 1.2rem
    font-size: 0.9rem

</style>