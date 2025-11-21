<template>
    <div class="container" v-if="status">
        <div class="updates">
            Last Update:
            <div v-for="(date, type) in status.status.updates">
                {{ type.replace("lastUpdate", "") }}: {{ date }}
            </div>
        </div>
    </div>
</template>

<script>
import utilsNetwork from '@/lib/utils_network'


export default {
    data() {
        return {
            status: null,
        }
    },
    props: {
        item: Object
    },


    methods: {
        getStatus: async function () {
            // Get the status from ID
            this.status = await utilsNetwork.systemStatus()
            console.info("status: ", this.status)
        }
    },

    mounted() {
        this.getStatus()
    }
}

</script>

<style scoped>
.container {
    padding: 5px;
}

.history {
    border: 1px solid black;
}

tr:nth-child(odd):hover,
tr:hover {
    background-color: rgb(143, 141, 141);
    color: whitesmoke;
}

.nines {
    margin-top: 8px;
}

.record-id {
    margin-bottom: 8px;
}

tr:nth-child(odd) {
    background-color: blanchedalmond;
}

strong {
    font-weight: bold;
}
</style>