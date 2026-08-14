<template>
    <span :data-tooltip="useLabel" class="simptip-position-right" v-for="icon in useIcon">
        <span :class="['material-icons-outlined', icon, 'bcp-icon', {'pref': isPreferred, 'notPref': !isPreferred, 'und': isUnd}]"> ({{ icon }})</span>
    </span>
</template>

<script>


export default {
    name: "BcpIndicator",
    components: {
    },

    props: {
        data: Object,
    },

    data: function () {
        return { }
    },

    created: function () {},

    computed: {

        useLabel() {
            if (this.data.code) return this.data.code
        },


        useIcon() {
            const preferred = ['translate']
            const notPref = ['translate']

            if (this.data.code){
                if (this.data.pref) return preferred
                else return notPref
            }
            return []
        },

        isPreferred(){
            return this.data.pref
        },

        isUnd(){
            return this.data.code.includes('und')
        },
    },

    methods: {}

};

</script>

<style scoped>
.bcp-icon {
    font-size: .9em
}

.pref {
    color: green;
}

.notPref {
    color: gray;
}

.und {
    color: red;
}

</style>
