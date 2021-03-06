export const state = () => ({
  session: null
})

export const actions = {
  async nuxtServerInit ({ dispatch }, { req, store }) {
    await dispatch('api/config/get')
  },
  connectWebSocket ({
    commit,
    state
  }) {
    this.$wss.connect()
  }
}
