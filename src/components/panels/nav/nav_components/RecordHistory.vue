<template>
    <div class="container">
        <div class="record-id">
            <strong>ID:</strong> <a :href="'https://id.loc.gov/resources/works/' + recordId" target="_blank">{{ recordId
                }}</a>
            <br>
            <strong>Encoding Level:</strong> {{ encLvl }}
            <br>
            <strong>Cataloging Authentication Code(s):</strong> {{ authentication.join(" ") }}
        </div>
        <strong>History</strong>
        <table class="history">
            <tr v-for="datum in adminMetadata">
                <td>
                    {{ datum.dateString }}
                </td>
                <td>
                    {{ datum.status }}
                </td>
            </tr>
        </table>

        <table class="nines">
            <tr v-for="nine in nineXX">
                <td colspan="2">
                    {{ nine }}
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    data() {
        return {
            recordId: null,
            adminMetadata: null,
            nineXX: null,
            encLvl: null,
            authentication: []
        }
    },
    props: {
        item: Object
    },


    methods: {
        getAdminMetadata: function () {
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
                        date = data["http://id.loc.gov/ontologies/bibframe/date"][0]["http://id.loc.gov/ontologies/bibframe/date"]
                        status = data["http://id.loc.gov/ontologies/bibframe/status"][0]["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"]
                        let dt = new Date(date).toLocaleString()
                        admin.push({ "date": date, "status": status, "dateString": dt })
                    } catch {
                        try {
                            for (let thing in data) {
                                if (thing.includes("/d9")) {
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

            this.adminMetadata = admin.sort((a, b) => {
                return new Date(a.date) - new Date(b.date)
            })
            this.nineXX = nines

        }
    },

    mounted() {
        window.setTimeout(()=>{
            this.getAdminMetadata()
        },2000)
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