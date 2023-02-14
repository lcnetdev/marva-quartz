export const configStore = defineStore('config', {
  state: () => ({
   count: 0, name: 'Eduardo' 
  }),
  getters: {
    // doubleCount: (state) => state.count * 2,
  },
  actions: {
    // increment() {
    //   this.count++
    // },
  },
})