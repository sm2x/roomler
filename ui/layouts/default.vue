<template>
  <v-app id="inspire">
    <left-panel
      v-if="isAuthenticated"
      :drawer="panelLeft"
      :rooms="rooms"
      :tree="tree"
      :peers="peers"
      :user="user"
      :conference-session="conferenceSession"
      :conference-room="conferenceRoom"
      :room-route="roomRoute"
    />
    <right-panel
      v-if="room && room._id"
      :drawer="panelRight"
      :room="room"
      :peers="peers"
    />
    <v-app-bar
      app
      clipped-left
      clipped-right
      color="red"
      dense
    >
      <v-app-bar-nav-icon v-if="isAuthenticated" @click.stop="toggle('left')" />
      <logo />
      <v-toolbar-title class="mr-12 align-center">
        <span class="title">{{ title }}</span>
      </v-toolbar-title>
      <div class="flex-grow-1" />

      <auth-panel />
    </v-app-bar>

    <v-content class="pt-9 ma-0">
      <v-container
        :fill-height="fillHeight"
        class="pa-0 ma-0"
        fluid
      >
        <v-row
          v-show="room"
          justify="center"
          align="stretch"
          align-content="start"
        >
          <v-col>
            <room-panel
              :rooms="rooms"
              :room="room"
              :peers="peers"
              :user="user"
              :room-route="roomRoute"
              :room-query="roomQuery"
              :conference-session="conferenceSession"
              :conference-room="conferenceRoom"
              :invites="invites"
            />
          </v-col>
        </v-row>
        <v-row
          justify="center"
          align="stretch"
          align-content="start"
        >
          <v-col>
            <nuxt />
          </v-col>
        </v-row>
        <bottom-panel />
      </v-container>
      <toaster />
    </v-content>
  </v-app>
</template>

<script>

import Logo from '@/components/logo'
import AuthPanel from '@/components/auth-panel'
import LeftPanel from '@/components/left-panel'
import RightPanel from '@/components/right-panel'
import RoomPanel from '@/components/room-panel'
import BottomPanel from '@/components/bottom-panel'
import Toaster from '@/components/toaster'

export default {
  middleware: 'default-routes',
  components: {
    Logo,
    AuthPanel,
    LeftPanel,
    RightPanel,
    RoomPanel,
    BottomPanel,
    Toaster
  },
  data: () => ({
    title: 'Roomler',
    bottomNav: ''
  }),
  computed: {
    areRoomRoutes () {
      return this.$route && this.$route.name && this.$route.name.startsWith('room')
    },
    roomRoute () {
      return this.$route && this.$route.name.startsWith('room-')
        ? this.$route.name.replace('room-', '')
        : null
    },
    roomQuery () {
      const query = this.roomRoute ? this.$route.query : null
      return query
    },
    fillHeight () {
      return !this.areRoomRoutes
    },
    isAuthenticated () {
      return this.$store.getters['api/auth/isAuthenticated']
    },
    isActivated () {
      return this.$store.getters['api/auth/isActivated']
    },
    user () {
      return this.$store.state.api.auth.user
    },
    peers () {
      const result = this.$store.getters['api/auth/getPeers']
      return result
    },
    rooms () {
      return this.$store.state.api.room.rooms
    },
    room () {
      return this.$store.state.api.room.room
    },
    conferenceSession () {
      return this.$store.state.api.conference.session
    },
    conferenceRoom () {
      return this.$store.state.api.conference.room
    },
    tree () {
      return this.$store.state.api.room.tree
    },
    invites () {
      return this.$store.state.api.invite.invites
    },
    panelLeft () {
      return this.$store.state.panel.left
    },
    panelRight () {
      return this.$store.state.panel.right
    }
  },
  created () {
    this.$vuetify.theme.dark = true
  },
  methods: {
    toggle (panel) {
      this.$store.commit('panel/toggle', panel)
    }
  }
}
</script>
