<template>
  <div class="totoro-mascot" @click="handleClick">
    <div class="totoro-wrapper">
      <div class="Totoro">
        <div class="Totoro__head">
          <div class="Totoro__ears">
            <div class="Totoro__ear Totoro__ear--left"></div>
            <div class="Totoro__ear Totoro__ear--right"></div>
          </div>
          <div class="Totoro__eyes" :class="{ blinking }">
            <div class="Totoro__eye Totoro__eye--left"></div>
            <div class="Totoro__eye Totoro__eye--right"></div>
          </div>
          <div class="Totoro__nose"></div>
          <div class="Totoro__whiskers">
            <div class="Totoro__whisker Totoro__whisker--left"></div>
            <div class="Totoro__whisker Totoro__whisker--right"></div>
          </div>
        </div>
        <div class="Totoro__body">
          <div class="Totoro__belly">
            <div class="Totoro__bellyMarks"></div>
          </div>
        </div>
        <div class="Totoro__arms">
          <div class="Totoro__arm Totoro__arm--left"></div>
          <div class="Totoro__arm Totoro__arm--right"></div>
        </div>
        <div class="Totoro__legs">
          <div class="Totoro__leg Totoro__leg--left"></div>
          <div class="Totoro__leg Totoro__leg--right"></div>
        </div>
      </div>
    </div>
    <!-- Petites feuilles qui tombent au clic -->
    <div v-if="showLeaves" class="leaves">
      <span v-for="i in 5" :key="i" class="leaf" :style="{ '--i': i }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const blinking = ref(false);
const showLeaves = ref(false);
let blinkInterval: ReturnType<typeof setInterval> | null = null;

function blink() {
  blinking.value = true;
  setTimeout(() => { blinking.value = false; }, 200);
}

function handleClick() {
  showLeaves.value = true;
  setTimeout(() => { showLeaves.value = false; }, 1500);
}

onMounted(() => {
  // Cligne des yeux toutes les 3-6 secondes
  blinkInterval = setInterval(() => {
    blink();
  }, 3000 + Math.random() * 3000);
});

onUnmounted(() => {
  if (blinkInterval) clearInterval(blinkInterval);
});
</script>

<style scoped>
.totoro-mascot {
  position: fixed;
  bottom: calc(var(--nav-height) + 28px + var(--safe-area-bottom));
  left: 16px;
  z-index: 90;
  cursor: pointer;
  animation: totoro-appear 800ms var(--spring) both;
  animation-delay: 600ms;
  -webkit-tap-highlight-color: transparent;
}

@keyframes totoro-appear {
  from {
    transform: translateY(30px) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.totoro-wrapper {
  width: 48px;
  height: 56px;
  position: relative;
  animation: totoro-breathe 4s ease-in-out infinite;
  filter: drop-shadow(0 2px 6px rgba(45, 48, 40, 0.15));
}

@keyframes totoro-breathe {
  0%, 100% { transform: scaleY(1) translateY(0); }
  50% { transform: scaleY(1.02) translateY(-1px); }
}

.totoro-mascot:active .totoro-wrapper {
  transform: scale(0.9);
  transition: transform 100ms ease;
}

/* ── Mini Totoro (scaled down from original CSS art) ── */
.Totoro {
  position: relative;
  display: inline-block;
  height: 100%;
  width: 75%;
  left: 12.5%;
}

.Totoro__body {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 88%;
  height: 73%;
  border-radius: 50%;
  background: #4c4a43;
  transform: translate(-50%);
}

.Totoro__belly {
  position: absolute;
  inset: 2%;
  border-radius: 50%;
}

.Totoro__belly::before,
.Totoro__belly::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.Totoro__belly::before {
  bottom: 2%;
  left: 3%;
  right: 3%;
  top: 15%;
  background: #6c685c;
}

.Totoro__belly::after {
  bottom: 1%;
  left: 5%;
  right: 5%;
  top: 10%;
  background: #6c685c;
}

.Totoro__arms {
  position: absolute;
  left: 0;
  right: 0;
  top: 30%;
  bottom: 25%;
}

.Totoro__arm {
  position: absolute;
  z-index: -1;
  width: 20%;
  height: 100%;
  background: #4c4a43;
  border-radius: 200% 150% 50% 150%;
}

.Totoro__arm--right {
  right: 6%;
  transform: rotateY(180deg) rotate(15deg);
}

.Totoro__arm--left {
  left: 6%;
  transform: rotate(15deg);
}

.Totoro__head {
  position: absolute;
  top: 14%;
  left: 50%;
  width: 78%;
  height: 32%;
  transform: translate(-50%);
}

.Totoro__head::before {
  content: "";
  position: absolute;
  inset: 0;
  background: #4c4a43;
  clip-path: polygon(0% 100%, 12% 30%, 30% 10%, 70% 10%, 88% 30%, 100% 100%);
}

.Totoro__head::after {
  content: "";
  position: absolute;
  left: 12%;
  right: 12%;
  top: -8%;
  bottom: 55%;
  background: #4c4a43;
  clip-path: ellipse(51.7% 100% at 50% 97%);
}

.Totoro__eyes {
  position: absolute;
  z-index: 10;
  top: 20%;
  left: 23%;
  right: 23%;
  height: 19%;
  transition: transform 100ms ease;
}

.Totoro__eyes.blinking {
  transform: scaleY(0.1);
}

.Totoro__eye {
  position: absolute;
  top: 50%;
  width: 21%;
  height: 100%;
  border-radius: 50%;
  background: #b2b4b4;
  transform: translateY(-50%);
}

.Totoro__eye::before {
  content: "";
  position: absolute;
  top: 47%;
  left: 55%;
  width: 38%;
  aspect-ratio: 1/1;
  background: #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.Totoro__eye--right {
  right: 0;
}

.Totoro__eye--right::before {
  left: 45%;
}

.Totoro__nose {
  position: absolute;
  z-index: 10;
  top: 63%;
  left: 50%;
  width: 40%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  background: radial-gradient(circle at 39% 18%, #585954 19%, #1a1a1b 20%);
  transform: translate(-50%, -50%);
  clip-path: circle(50% at 50% -42%);
}

.Totoro__whiskers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.Totoro__whisker {
  position: absolute;
  top: 45%;
  width: 27%;
  height: 1.8%;
  background: #000;
}

.Totoro__whisker--left {
  left: -7%;
  transform: rotate(3deg);
}

.Totoro__whisker--right {
  right: -7%;
  transform: rotate(-3deg);
}

.Totoro__whisker::before,
.Totoro__whisker::after {
  content: "";
  position: absolute;
  width: 100%;
  aspect-ratio: 23/0.8;
  background: #000;
}

.Totoro__whisker::before {
  top: 600%;
}

.Totoro__whisker::after {
  top: 1100%;
}

.Totoro__whisker--left::before {
  left: -12%;
  transform: rotate(-10deg);
}

.Totoro__whisker--right::before {
  right: -12%;
  transform: rotate(10deg);
}

.Totoro__whisker--left::after {
  left: -4%;
  transform: rotate(-17deg);
}

.Totoro__whisker--right::after {
  right: -4%;
  transform: rotate(17deg);
}

.Totoro__whisker--left,
.Totoro__whisker--left::before,
.Totoro__whisker--left::after {
  border-top-left-radius: 100%;
}

.Totoro__whisker--right,
.Totoro__whisker--right::before,
.Totoro__whisker--right::after {
  border-top-right-radius: 100%;
}

.Totoro__bellyMarks {
  position: absolute;
  z-index: 10;
  top: 20%;
  left: 10%;
  right: 10%;
  height: 20%;
  background:
    radial-gradient(circle at 10% 100%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 10% 85%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 30% 100%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 30% 85%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 50% 100%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 50% 85%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 68% 100%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 68% 85%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 90% 100%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 90% 85%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 25% 40%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 25% 25%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 43% 40%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 43% 25%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 58% 40%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 58% 25%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 75% 40%, #6c685c 8%, rgba(0,0,0,0) 6%),
    radial-gradient(circle at 75% 25%, #4c4a43 8%, rgba(0,0,0,0) 6%),
    #6c685c;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

.Totoro__legs {
  position: absolute;
  z-index: -1;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
}

.Totoro__leg {
  position: absolute;
  bottom: 0;
  width: 50%;
  height: 100%;
  background: #4c4a43;
}

.Totoro__leg--left {
  left: 0;
  clip-path: circle(75% at 82% 16%);
}

.Totoro__leg--right {
  left: 50%;
  clip-path: circle(75% at 18% 16%);
}

.Totoro__legs::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: ellipse(30% 18% at 50% 98.5%);
  background: #4c4a43;
}

.Totoro__ears {
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70%;
  transform: translateY(-90%);
}

.Totoro__ear {
  position: absolute;
  top: 55%;
  width: 10%;
  aspect-ratio: 1/1;
  background: #4c4a43;
  border-radius: 50%;
}

.Totoro__ear--left {
  left: 20%;
}

.Totoro__ear--right {
  right: 20%;
}

.Totoro__ear::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  aspect-ratio: 1/2;
  background: #4c4a43;
  transform-origin: 50% 100%;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.Totoro__ear--left::before {
  transform: translateY(-100%) rotate(-8deg);
}

.Totoro__ear--right::before {
  transform: translateY(-100%) rotate(8deg);
}

.Totoro__ear::after {
  content: "";
  position: absolute;
  top: 70%;
  width: 60%;
  height: 120%;
  background: #4c4a43;
}

.Totoro__ear--left::after {
  left: 40%;
  transform: rotate(-15deg);
}

.Totoro__ear--right::after {
  right: 40%;
  transform: rotate(15deg);
}

/* ── Feuilles qui tombent au clic ── */
.leaves {
  position: absolute;
  top: -10px;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
}

.leaf {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #4A7C59;
  border-radius: 0 50% 50% 50%;
  transform: rotate(45deg);
  opacity: 0;
  animation: leaf-fall 1.2s ease-out forwards;
  animation-delay: calc(var(--i) * 80ms);
}

.leaf:nth-child(2) { background: #6B9E76; }
.leaf:nth-child(3) { background: #8AB88E; width: 6px; height: 6px; }
.leaf:nth-child(4) { background: #5E9E5E; }
.leaf:nth-child(5) { background: #4A7C59; width: 7px; height: 7px; }

@keyframes leaf-fall {
  0% {
    opacity: 1;
    transform: rotate(45deg) translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotate(calc(45deg + var(--i) * 72deg))
               translate(calc((var(--i) - 3) * 18px), 40px)
               scale(0.4);
  }
}

/* Desktop: place a cote de la sidebar */
@media (min-width: 1025px) {
  .totoro-mascot {
    bottom: 24px;
    left: 24px;
  }
}
</style>
