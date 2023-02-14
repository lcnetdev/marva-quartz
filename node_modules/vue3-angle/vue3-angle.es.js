import { defineComponent, ref, watch, computed, onMounted, createVNode } from "vue";
const calcAngle = (element, event) => {
  const rect = element.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const x = Math.abs(originX - event.clientX);
  const y = Math.abs(originY - event.clientY);
  const z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  const cos = y / z;
  const rad = Math.acos(cos);
  let angle = Math.floor(180 / (Math.PI / rad));
  if (event.clientX > originX && event.clientY > originY) {
    angle = 180 - angle;
  }
  if (event.clientX == originX && event.clientY > originY) {
    angle = 180;
  }
  if (event.clientX > originX && event.clientY == originY) {
    angle = 90;
  }
  if (event.clientX < originX && event.clientY > originY) {
    angle = 180 + angle;
  }
  if (event.clientX < originX && event.clientY == originY) {
    angle = 270;
  }
  if (event.clientX < originX && event.clientY < originY) {
    angle = 360 - angle;
  }
  return angle;
};
let isDragging = false;
const triggerDragEvent = (element, options) => {
  const moveFn = function(event) {
    var _a;
    (_a = options.drag) == null ? void 0 : _a.call(options, event);
  };
  const upFn = function(event) {
    var _a;
    document.removeEventListener("mousemove", moveFn, false);
    document.removeEventListener("mouseup", upFn, false);
    document.onselectstart = null;
    document.ondragstart = null;
    isDragging = false;
    (_a = options.end) == null ? void 0 : _a.call(options, event);
  };
  if (element) {
    element.addEventListener("mousedown", (event) => {
      var _a;
      if (isDragging)
        return;
      document.onselectstart = () => false;
      document.ondragstart = () => false;
      document.addEventListener("mousemove", moveFn, false);
      document.addEventListener("mouseup", upFn, false);
      isDragging = true;
      (_a = options.start) == null ? void 0 : _a.call(options, event);
    });
  }
  return;
};
var index = "";
const angleProps = {
  angle: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 16,
    validator: (value) => {
      return value >= 16;
    }
  },
  borderWidth: {
    type: Number,
    default: 1,
    validator: (value) => {
      return value >= 1;
    }
  },
  borderColor: {
    type: String,
    default: "#666"
  }
};
var Angle = defineComponent({
  name: "Angle",
  props: angleProps,
  emits: ["update:angle", "change"],
  setup(props, {
    emit
  }) {
    const angleRef = ref(null);
    const rotate = ref(props.angle);
    watch(() => props.angle, (angle) => {
      rotate.value = angle;
    });
    const updateAngle = () => {
      let value = Number(rotate.value);
      if (!isNaN(value)) {
        value = value > 360 || value < 0 ? props.angle : value;
        rotate.value = value === 360 ? 0 : value;
        emit("update:angle", rotate.value);
        emit("change", rotate.value);
      }
    };
    const getStyle = computed(() => {
      return {
        width: props.size + "px",
        height: props.size + "px",
        borderWidth: props.borderWidth + "px",
        borderColor: props.borderColor,
        transform: `rotate(${rotate.value}deg)`
      };
    });
    const handleDrag = (event) => {
      if (angleRef.value) {
        rotate.value = calcAngle(angleRef.value, event) % 360;
        updateAngle();
      }
    };
    onMounted(() => {
      const dragConfig = {
        drag: (event) => {
          handleDrag(event);
        },
        end: (event) => {
          handleDrag(event);
        }
      };
      if (angleRef.value) {
        triggerDragEvent(angleRef.value, dragConfig);
      }
    });
    return () => {
      return createVNode("div", {
        "class": "bee-angle"
      }, [createVNode("div", {
        "class": "bee-angle__round",
        "ref": angleRef,
        "style": getStyle.value
      }, null)]);
    };
  }
});
const AnglePlugin = {
  install: (app) => {
    app.component(Angle.name, Angle);
  }
};
export { Angle, AnglePlugin as default };
