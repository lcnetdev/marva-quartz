<template>
    <div class="container" v-if="status">
        <div class="updates">
            <p>Last Update:</p>
            <div v-for="(date, type) in status.status.updates">
                <dl>
                    <dt>{{ type.replace("lastUpdate", "") }}: </dt>
                    <dd>{{ date }}</dd>
                </dl>
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

p {
    font-size: 1.3em;
}

.updates > p,
strong,
dt {
    font-weight: bold;
}
dd {
    font-size: .9em;
    padding-left: 8px;
}
</style>