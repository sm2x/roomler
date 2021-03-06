<template>
  <div
    :id="elemId"
    :ref="elemId"
    v-scroll:[`#${elemId}`]="onMessagesScroll"
    style="height: calc(100vh - 380px); overflow-y: auto; overflow-x: hidden"
  >
    <add-reaction-menu
      :open="menu.addReaction.open"
      :emojis="emojis"
      :x="menu.addReaction.x"
      :y="menu.addReaction.y"
      :message="menu.addReaction.message"
      @hideMenu="hideMenu"
      @noScroll="noScroll"
    />
    <template v-for="(value, propertyName) in messages">
      <v-subheader :key="`subheader_${propertyName}`">
        {{ propertyName }}
      </v-subheader>
      <v-timeline
        :key="propertyName"
        dense
      >
        <v-scroll-y-reverse-transition
          group
        >
          <v-timeline-item
            v-for="message in messages[propertyName]"
            :id="'message_item_' + getMessageId(message)"
            :key="getMessageId(message)"
            :icon="!getUser(message.author) || !getUser(message.author).avatar_url ? 'fa-user' : undefined"
            data-type="message_item"
            small
          >
            <v-badge
              slot="icon"
              :color="isOnline(message.author) ? 'green' : 'grey'"
              bordered
              bottom
              left
              dot
              offset-x="8"
              offset-y="8"
            >
              <v-avatar v-if="getUser(message.author) && getUser(message.author).avatar_url" size="32">
                <img :src="getUser(message.author) && getUser(message.author).avatar_url">
              </v-avatar>
            </v-badge>
            <v-hover v-slot:default="{ hover }">
              <v-card
                :elevation="hover ? 16 : 2"
                :class="message.has_mention && !message.is_read ? 'mr-4 red lighten-4' : (!message.is_read || !message._id ? 'mr-4 orange lighten-4' : 'mr-4 white')"
                light
              >
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      fab
                      right
                      bottom
                      x-small
                      absolute
                      color="green"
                      v-on="on"
                      @click="showMenu($event, message)"
                    >
                      😄
                    </v-btn>
                  </template>
                  <span>Add reaction</span>
                </v-tooltip>
                <v-tooltip v-if="user && message.author === user._id" top>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      v-if="user && message.author === user._id"
                      fab
                      right
                      bottom
                      x-small
                      absolute
                      color="secondary"
                      :style="`margin-right: 36px !important;`"
                      v-on="on"
                      @click="toggleEdit(message)"
                    >
                      <v-icon v-if="!message.edit" x-small>
                        fa-edit
                      </v-icon>
                      <v-icon v-if="message.edit" x-small>
                        fa-window-close
                      </v-icon>
                    </v-btn>
                  </template>
                  <span v-if="!message.edit">Edit message</span>
                  <span v-if="message.edit">Discard changes</span>
                </v-tooltip>
                <v-tooltip v-if="user && message.author === user._id" top>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      v-if="user && message.author === user._id"
                      fab
                      right
                      bottom
                      x-small
                      absolute
                      color="secondary"
                      :style="`margin-right: 72px !important;`"
                      v-on="on"
                      @click="messageDeleteConsent(message)"
                    >
                      <v-icon x-small>
                        fa-trash
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>Delete message</span>
                </v-tooltip>
                <v-card-title class="overline">
                  {{ getUser(message.author).username }}, {{ datetimeUtils.toHoursFormat(message.createdAt) }} &nbsp;
                  <v-tooltip v-if="message.has_mention" right>
                    <template v-slot:activator="{ on }">
                      <v-icon small color="red" v-on="on">
                        fa-at
                      </v-icon>
                    </template>
                    <span>You are mentioned in this messsage!</span>
                  </v-tooltip>
                </v-card-title>
                <v-card-text>
                  <pre v-if="!message.edit" style="white-space: pre-wrap" v-html="message.content" />
                  <tiptap
                    v-if="room && message && message._id && message.edit"
                    :elem-id="`edit-message-${message._id}`"
                    :users="roomPeers"
                    :gallery="room.path"
                    :content="message.content"
                    :message="message"
                    @sendMessage="sendMessage"
                  />
                </v-card-text>
              </v-card>
            </v-hover>
            <v-spacer />
            <message-reaction-list
              :message="message"
              :reactions="getReactions(message)"
              @noScroll="noScroll"
            />
          </v-timeline-item>
        </v-scroll-y-reverse-transition>
      </v-timeline>
    </template>
    <message-delete-dialog
      :dialog="messageDeletedDialog"
      :message="selectedMessage"
      @messageDelete="messageDelete"
      @messageDeleteCancel="messageDeleteCancel"
    />
  </div>
</template>

<script>
import { domUtils } from '@/utils/dom-utils'
import { datetimeUtils } from '@/utils/datetime-utils'
import Tiptap from '@/components/editor/tiptap'
import AddReactionMenu from '@/components/chat/add-reaction-menu'
import MessageReactionList from '@/components/chat/message-reaction-list'
import MessageDeleteDialog from '@/components/chat/message-delete-dialog'
import * as EmojiMap from 'emojilib'
import * as cheerio from 'cheerio'
import * as uuid from 'uuid/v4'

const scrollDirection = {
  noScroll: 'no_scroll',
  bottom: 'bottom',
  top: 'top'
}
export default {
  components: {
    Tiptap,
    AddReactionMenu,
    MessageReactionList,
    MessageDeleteDialog
  },
  props: {
    elemId: {
      type: String,
      default: ''
    },
    inputId: {
      type: String,
      default: ''
    },
    user: {
      type: Object,
      default: null
    },
    room: {
      type: Object,
      default: null
    },
    messages: {
      type: Object,
      default () {
        return {}
      }
    },
    unreads: {
      type: Array,
      default () {
        return []
      }
    },
    isChatPanel: {
      type: Boolean,
      default: false
    }
  },
  data () {
    const emojis = EmojiMap.ordered.map((name) => {
      const result = { ...EmojiMap.lib[name], name, key: uuid() }
      return result
    })
    return {
      emojis,
      datetimeUtils,
      autoScrollTimeout: null,
      manualScrollTimeout: null,
      mouseoverTimeout: null,
      selectedMessage: null,
      messageDeletedDialog: false,
      menu: {
        addReaction: {
          x: 0,
          y: 0,
          open: false,
          message: null
        },
        reactionMembers: {
          x: 0,
          y: 0,
          open: false
        }
      },
      scroll: scrollDirection.bottom
    }
  },

  computed: {
    roomPeers () {
      return this.room ? this.$store.getters['api/auth/getRoomPeers'](this.room) : []
    }
  },

  watch: {
    messages (newVal, oldVal) {
      const self = this
      this.$nextTick(() => {
        if (self.autoScrollTimeout) {
          clearTimeout(self.autoScrollTimeout)
        }
        self.autoScrollTimeout = setTimeout(() => {
          if (self.scroll === scrollDirection.bottom || self.scroll === scrollDirection.top) {
            self.scrollMessages(self.scroll === scrollDirection.bottom)
          }
          self.scroll = scrollDirection.bottom
        }, 300)
      })
    },
    isChatPanel (newVal) {
      if (newVal) {
        this.scrollMessages(true)
      }
    }
  },

  beforeMount () {
    const self = this
    window.addEventListener('focus', this.readUnreads)
    window.addEventListener('unload', () => {
      window.removeEventListener('focus', self.readUnreads)
    })
  },

  async mounted () {
    this.scrollMessages(true)
    await this.readUnreads()
  },

  beforeDestroy () {
    window.removeEventListener('focus', this.readUnreads)
  },

  methods: {
    toggleEdit (message) {
      this.$store.commit('api/message/toggleEdit', message, { root: true })
    },
    messageDeleteConsent (message) {
      this.selectedMessage = message
      this.messageDeletedDialog = true
    },
    async messageDelete (message) {
      await this.sendMessage('<p><em>Message was deleted by the author</em></p>', message)
      this.selectedMessage = null
      this.messageDeletedDialog = false
    },
    messageDeleteCancel (message) {
      this.selectedMessage = null
      this.messageDeletedDialog = false
    },
    getUser (userid) {
      return this.$store.getters['api/auth/getUser'](userid)
    },
    isOnline (userid) {
      return this.$store.getters['api/auth/isOnline'](userid)
    },
    getReactions (message) {
      const result = this.$store.getters['api/message/reactions'](message)
      return result
    },

    showMenu (e, message) {
      if (!this.menu.addReaction.open) {
        this.menu.addReaction.x = e.clientX
        this.menu.addReaction.y = e.clientY - 100
        this.menu.addReaction.message = message
        this.menu.addReaction.open = true
      }
    },
    hideMenu () {
      this.menu.addReaction.open = false
    },

    getMessageId (message) {
      return message._id || message.client_id
    },
    scrollMessages (bottom = true) {
      const messagesList = this.$refs[this.elemId]
      if (messagesList) {
        const newScrollTop = bottom ? messagesList.scrollHeight : messagesList.scrollTop + 10
        messagesList.scrollTop = newScrollTop
        this.$vuetify.goTo(`#${this.inputId}`)
      }
    },
    noScroll () {
      this.scroll = scrollDirection.noScroll
    },
    onMessagesScroll (e) {
      if (this.manualScrollTimeout) {
        clearTimeout(this.manualScrollTimeout)
      }
      this.manualScrollTimeout = setTimeout(async () => {
        await this.readUnreads()
        if (e.target.scrollTop === 0) {
          this.scroll = scrollDirection.top
          await this.loadPreviousMessages()
        }
      }, 100)
    },
    async loadPreviousMessages () {
      const payload = { room: this.room }
      const messageKeys = Object.keys(this.messages).sort().reverse()
      if (this.messages && messageKeys.length) {
        payload.before = this.messages[messageKeys[0]][0].createdAt
      }
      await this.$store.dispatch('api/message/getAll', payload)
    },
    async readUnreads () {
      const self = this
      if (this.unreads && document.hasFocus()) {
        const messagesInView = []
        this.unreads.forEach((message) => {
          const messageList = document.getElementById(self.elemId)
          const messageItem = document.getElementById(`message_item_${self.getMessageId(message)}`)
          const inView = domUtils.isScrolledIntoView(messageItem)
          if (messageList && messageItem && inView) {
            messagesInView.push(message._id)
          }
        })
        if (messagesInView && messagesInView.length) {
          this.scroll = scrollDirection.noScroll
          await this.$store.dispatch('api/message/readby/pushAll', messagesInView)
        }
      }
    },
    async sendMessage (content, message) {
      if (content && content !== '<p></p>') {
        const $ = cheerio.load(content)
        const mentions = [...new Set($('a[data-username]').toArray().map(node => node.attribs.userkey))]
        const files = [...new Set($('a[data-upload]').toArray().map((node) => {
          return {
            filename: node.attribs.filename,
            href: node.attribs.href
          }
        }))]
        const images = [...new Set($('img[data-upload]').toArray().map((node) => {
          return {
            filename: node.attribs.title,
            href: node.attribs.src
          }
        }))]
        await this.$store
          .dispatch('api/message/update', {
            id: message._id,
            update: {
              content,
              mentions,
              files: files.concat(images)
            }
          })
      }
    }
  }
}
</script>

<style>
.v-timeline-item__divider {
  min-width: 64px;
}
.v-timeline--dense .v-timeline-item__body {
  max-width: calc(100% - 64px);
}
.v-application--is-ltr .v-timeline--dense:not(.v-timeline--reverse):before {
    left: calc(32px - 1px)
}
</style>
