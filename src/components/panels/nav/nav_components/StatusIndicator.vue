<template>
    <div class="container">
        <div class="led-box simptip-position-left" :data-tooltip="'Load Status: ' + (currentStatus == 'current' ? ':)' : ':(')">
            <div :class="currentStatus"></div>
        </div>
    </div>
</template>


<script>
export default {
    data() {
        return {
            currentStatus: "current"
        }
    },
    props: {
        item: Object
    },

    // watch: {
    //     currentStatus(current){
    //         if (current != "current"){
    //             console.info("checking?")
    //             // set an intervale to keep getting status, every 15 seconds
    //             this.timer = window.setInterval(() => {
    //                 this.getStatus()
    //             }, 150000)
    //         }
    //     }
    // },

    methods: {
        getStatus: async function () {
            // Get the status from ID
            // let response = await something()
            this.currentStatus = "current"
        }
    },

    mounted() {
        this.getStatus()
    }
}
</script>

<style scoped>
.led-box {
    /* width: 25%; */
    float: left;
}

.led-box p {
    font-size: 12px;
    text-align: center;
    margin: 1em;
}

.current {
    margin: 0 auto;
    width: 24px;
    height: 24px;
    background-color: #ABFF00;
    border-radius: 50%;
    box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #304701 0 -1px 9px, #89FF00 0 2px 12px;
}

.slow {
    margin: 0 auto;
    width: 24px;
    height: 24px;
    background-color: #FF0;
    border-radius: 50%;
    box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #808002 0 -1px 9px, #FF0 0 2px 12px;
    -webkit-animation: blinkYellow 1s infinite;
    -moz-animation: blinkYellow 1s infinite;
    -ms-animation: blinkYellow 1s infinite;
    -o-animation: blinkYellow 1s infinite;
    animation: blinkYellow 1s infinite;
}
</style>