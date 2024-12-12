<template>
    <VueFinalModal
        display-directive="show"
        :hide-overlay="false"
        :overlay-transition="'vfm-fade'"
        @closed="closeModal()"
      >
        <VueDragResize
            :is-active="true"
            :w="850"
            :h="initalHeight"
            :x="initalLeft"
            :y="50"
            class="debug-modal"
            @resizing="dragResize"
            @dragging="dragResize"
            :sticks="['br']"
            :stickSize="22"
            >

            <div ref="autoDeweyModalContainer" class="complex-lookup-modal-container">
                <div style="position: relative;">
                    <div class="menu-buttons">
                        <button @click="closeModal()">Close</button>
                    </div>

                    <div class="input-panel">
                        <p>Hello?</p>

                        <label for="LcCall">LC Call Number: </label>
                        <input class="lcCallInput" name="LcCall" v-model="lcCallLocal" ref="inputLookup" type="text" />

                        <div v-for="opt in autoDeweyGenres">
                            <input type="radio" :value="opt" class="genre-type-radio" v-model="autoDeweyGenre" name="GenreType"/>
                            <label onclick="" class="toggle-btn">{{opt}}</label>
                        </div>

                        <button @click="dewIt()">Dew It</button>
                    </div>
                    <div class="results" v-if="deweyInfo">
                        <h2>Results</h2>
                        <dl>
                            <dt>DDC</dt>
                            <dd>{{ deweyInfo.DDC }}</dd>

                            <dt>DDC Caption</dt>
                            <dd>{{ deweyInfo['DDC Caption'] }}</dd>

                            <dt>LCC Caption</dt>
                            <dd>{{ deweyInfo['LCC Caption'] }}</dd>
                        </dl>
                        <button @click="add()">Add</button>
                    </div>
                </div>

            </div>
        </VueDragResize>
    </VueFinalModal>
  </template>


  <style type="text/css" scoped>
    dt {
        font-weight: bold;
    }

    dl,
    dd {
        font-size: 0.9rem;
    }

    dd {
        margin-bottom: 1em;
    }
  </style>

  <script>
    import { VueFinalModal } from 'vue-final-modal'
    import VueDragResize from 'vue3-drag-resize'
    import LcCallToDewey from '@/lib/auto_dewey'

    export default {
    name: "AutoDewey",
    components: {
        VueFinalModal,
        VueDragResize,
    },
    props: {
        lcCall: String,
    },

    watch: {},

    data: function() {
        return {
            autoDeweyGenres: ['fiction', 'poetry', 'drama'],
            autoDeweyGenre: null,
            lcCallLocal: null,
            deweyInfo: null
        }
    },

    computed: {},
    methods: {
        closeModal: function(){
            this.autoDeweyGenre = null
            this.lcCallLocal = null
            this.deweyInfo = null
            this.$emit('hideDeweyModal', true)
        },

        dewIt: function(){
            console.info("Dewing the thing")
            console.info("genre: ", this.autoDeweyGenre)
            console.info("lcCall: ", this.lcCallLocal)
            this.deweyInfo = LcCallToDewey(this.lcCallLocal, this.autoDeweyGenre)
            console.info(">>> deweyInfo", this.deweyInfo)
        },

        add: function(){
            console.info("adding to record")
            this.$emit('addDdc', this.deweyInfo)
            this.closeModal()
        }
    },

    created: function () {},
    before: function () {},
    mounted: function(){},


    updated: function() {
        //update local value from prop
        this.lcCallLocal = this.lcCall
    }
  };

  </script>