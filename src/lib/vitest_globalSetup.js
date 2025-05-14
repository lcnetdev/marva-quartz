/**
 * @vitest-environment jsdom
 */

const fs = require("fs")
import { useProfileStore } from '@/stores/profile'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

// this function is run before all the tests are run
// We'll download the profiles from the public endpoint and build them and save them to the public folder
// this way we don't have to download them for each test that uses them and we'll delete the file in teardown
export async function setup() {
    const pinia = createPinia()
    const app = createApp({})
    app.use(pinia)
    const profileStore = useProfileStore()
    await profileStore.buildProfiles()
    fs.writeFileSync("public/profiles.json", JSON.stringify(profileStore.profiles, null, 2));
    fs.writeFileSync("public/rtLookup.json", JSON.stringify(profileStore.rtLookup, null, 2));

}

export async function teardown() {
    try{
        fs.unlinkSync('public/profiles.json');
        fs.unlinkSync('public/rtLookup.json');

    }catch(e){
        console.log("error", e)
    }
    
}

