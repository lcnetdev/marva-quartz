<template>
    <div class="container" @click="(e) => e.stopPropagation()"> <!-- keep the window open when clicking -->
        <div class="record-id">
            <strong>ID:</strong> <a :href="'https://id.loc.gov/resources/works/' + recordId" target="_blank">{{ recordId
            }}</a>
            <br>
            <strong>Encoding Level:</strong> {{ encLvl }}
            <br>
            <strong>Cataloging Authentication Code(s):</strong> {{ authentication.join(" ") }}
        </div>
        <strong>History</strong>
        <span v-if="error">
            <p>There was an error getting the history for this record.</p>
        </span>
        <span v-else>
            <div class="table-container">
                <table class="history">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>EncLvl</th>
                            <th>Type</th>
                            <th>Comment</th>
                            <th>GenProcess</th>
                            <th>Agent</th>
                        </tr>
                    </thead>
                    <tr v-for="event in adminMetadata">
                        <td>
                            {{ event.date.value }}
                        </td>

                        <td v-if="event.encodingLevel">
                            {{ event.encodingLevel.value }}
                        </td>
                        <td v-else></td>

                        <td v-if="event.label">
                            {{ event.label.value }}
                        </td>
                        <td v-else></td>
                        <td v-if="event.comment">
                            <span v-if="event.seeAlso" v-html="setCommentString(event)">
                            </span>
                            <span v-else>
                                {{ event.comment.value }}
                            </span>
                        </td>
                        <td v-else></td>
                        <td v-if="event.generationProcess">
                            {{ event.generationProcess.value }}
                        </td>
                        <td v-else></td>

                        <td v-if="event.catalogerId">
                            {{ event.catalogerId.value }}
                        </td>
                        <td v-else-if="event.agent">
                            {{ event.agent.value }}
                        </td>
                        <td v-else></td>
                    </tr>
                </table>
            </div>
        </span>

        <div class="nines-container" v-if="nineXX && nineXX.length > 0">
            <strong>9XX</strong>
            <table class="nines">
                <tr v-for="nine in nineXX">
                    <td colspan="2">
                        {{ nine }}
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import utilsNetwork from '@/lib/utils_network'


export default {
    data() {
        return {
            recordId: null,
            adminMetadata: [],
            nineXX: null,
            encLvl: null,
            authentication: [],
            history: {},
            error: false,
        }
    },
    props: {
        item: Object
    },


    methods: {
        setCommentString: function (data) {
            let seeAlso = data.seeAlso.value
            let string = data.comment.value
            let targets = {}
            if (Array.isArray(seeAlso)) {
                for (let idx in seeAlso) {
                    let key = seeAlso[idx].split("/").at(-1)
                    targets[key] = seeAlso[idx]
                }
            } else {
                targets[data.seeAlso.value] = data.seeAlso.uri
            }
            for (let target in targets) {
                string = string.replace(target, "<a target='_blank' href='" + targets[target] + "'>" + target + "</a>")
            }

            return string
        },

        getAdminMetadata: async function () {
            let p = this.item.profile
            let work
            for (let rt in p.rt) {
                if (rt.includes(":Work")) {
                    work = p.rt[rt]
                }
            }
            let admin = []
            let nines = []
            for (let pt in work.pt) {
                if (pt.includes('_adminmetadata')) {
                    let target = work.pt[pt]
                    let userValue = target.userValue
                    let data = userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]
                    let date
                    let status

                    try {
                        status = data["http://id.loc.gov/ontologies/bibframe/status"][0]["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"]
                    } catch {
                        try {
                            for (let thing in data) {
                                if (thing.includes("/d9") && !thing.includes("/d955")) {
                                    nines.push(data[thing][0][thing])
                                }
                            }
                        } catch { }

                        if (Object.keys(data).includes("http://id.loc.gov/ontologies/bibframe/identifiedBy")) {
                            this.recordId = data["http://id.loc.gov/ontologies/bibframe/identifiedBy"][0]["http://www.w3.org/1999/02/22-rdf-syntax-ns#value"][0]["http://www.w3.org/1999/02/22-rdf-syntax-ns#value"]
                        }
                        if (Object.keys(data).includes("http://id.loc.gov/ontologies/bflc/encodingLevel")) {
                            this.encLvl = data["http://id.loc.gov/ontologies/bflc/encodingLevel"][0]["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"]
                        }
                        if (Object.keys(data).includes("http://id.loc.gov/ontologies/bibframe/descriptionAuthentication")) {
                            let authDesc = []
                            for (let auth of data["http://id.loc.gov/ontologies/bibframe/descriptionAuthentication"]) {
                                let id = auth["@id"].split("/").at(-1)
                                authDesc.push(id)
                            }
                            this.authentication = authDesc
                        }

                    }
                }
            }

            this.history = await utilsNetwork.recordHistory(this.recordId)
            if (this.history.error) {
                this.error = true
            } else {
                let historyJSON = JSON.parse(this.history.history)
                for (let event of historyJSON['@graph']) {
                    let e = {}
                    for (let key of Object.keys(event)) {
                        let data = event[key]
                        key = key.replace(/[a-z]+\:/, '')
                        let value
                        let uri
                        if (Object.keys(data).includes("@id")) {
                            uri = data['@id']
                        } else {
                            uri = false
                        }
                        if (key == 'agent' && Object.keys(data).includes("rdfs:label")) {
                            value = data['rdfs:label']
                        } else if (key == 'agent' && Object.keys(data).includes("bf:code")) {
                            value = data['bf:code']
                        } else if (Object.keys(data).includes("@value")) {
                            value = data['@value']
                        } else if (Object.keys(data).includes("@id")) {
                            value = data['@id'].split("/").at(-1)
                        } else {
                            if (Array.isArray(data)) {
                                value = data.map((d) => d['@id'])
                            } else {
                                value = data
                            }
                        }

                        if (key == 'date') {
                            value = value.replace("+00:00", "")
                        }

                        e[key] = {
                            'value': value,
                            'uri': uri,
                        }
                    }
                    this.adminMetadata.push(e)
                }
            }

            this.nineXX = nines

        }
    },

    mounted() {
        // this.getAdminMetadata()
        window.setTimeout(() => {
            this.getAdminMetadata() // for menu access
        }, 2000)
    },
}

</script>

<style scoped>
.container {
    padding: 5px;
}

.history {
    border: 1px solid black;
    table-layout: fixed;
    width: 735px;
}

.table-container {
    overflow-y: scroll;
    height: 65vh;
}

.history tr {
    text-align: center;
}

tr th {
    font-weight: bold;
}

tr:nth-child(odd):hover,
tr:hover {
    background-color: rgb(143, 141, 141);
    color: whitesmoke;
}

td {
    word-wrap: anywhere;
}

.nines-container {
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

<style>
#record-panel {
    left: -600px !important;
}
</style>