import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import Edit from "../views/Edit.vue";
import Load from "../views/Load.vue";
import EditMulti from "../views/EditMulti.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Load,
    },
    // {
    //   path: "/about",
    //   name: "about",
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import("../views/AboutView.vue"),
    // },

    {
      path: "/edit/:recordId",
      name: "Edit",
      component: Edit

    },
    {
      path: "/multiedit/:recordId",
      name: "MultiEdit",
      component: EditMulti

    },

    

    {
      path: "/load/",
      name: "Load",
      component: Load

    },



  ],
});

export default router;
