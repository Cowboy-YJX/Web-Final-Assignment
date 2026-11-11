<script setup lang="ts" name="EmailForm">
import rightImg from '@assets/svg/work.svg'
import WeChat from '@assets/photos/QR/WeChat.jpg'
import QQ from '@assets/photos/QR/QQ.jpg'
import XiaoHongShu from '@assets/photos/QR/XiaoHongShu.jpg'
</script>

<template>
  <section class="w-screen h-screen relative">
    <div
      class="w-[90vw] h-[85vh] bg-(--green) absolute left-1/2 top-27/50 -translate-1/2 flex"
      style="border-radius: 100px"
    >
      <div
        class="h-full w-[50%] font-OutFit text-(--black) flex flex-col justify-center py-[10vh] pl-[6vw]"
      >
        <div class="text-[4.2rem] mb-[8vh] leading-12">
          GET IN TOUCH :]<br />
          <span class="font-ThinFit text-[1.3rem]">交个朋友？谈场合作？联系我，或者我联系你</span>
        </div>

        <div class="flex-1">
          <span class="font-ThinFit chinese-form">你的称呼 / </span>YOUR NAME<br />
          <input
            type="text"
            class="form-input rounded-full mt-2 px-5 bg-(--white) h-[6vh] w-[32vw]"
          />
        </div>

        <div class="flex-1">
          <span class="font-ThinFit chinese-form">你的邮箱 / </span>YOUR EMAIL<br />
          <input
            type="text"
            class="form-input rounded-full mt-2 px-5 bg-(--white) h-[6vh] w-[32vw]"
          />
        </div>

        <div class="flex-1">
          <span class="font-ThinFit chinese-form">有何贵干 / </span>YOUR NEED<br />
          <input
            type="text"
            class="form-input rounded-full mt-2 px-5 bg-(--white) h-[6vh] w-[32vw]"
          />
        </div>

        <div class="w-full flex gap-[3vw] mt-5">
          <div class="font-ThinFit text-[14px] text-center">
            <img :src="WeChat" alt="" class="w-20 mb-2" />
            WeChat
          </div>
          <div class="font-ThinFit text-[14px] text-center">
            <img :src="QQ" alt="" class="w-20 mb-2" />
            QQ
          </div>
          <div class="font-ThinFit text-[14px] text-center">
            <img :src="XiaoHongShu" alt="" class="w-20 mb-2" />
            XiaoHongShu
          </div>

          <div
            type="submit"
            class="submit-btn w-25 h-12 rounded-full bg-transparent relative self-center"
          ></div>
        </div>
      </div>

      <div class="bg-(--black) h-full w-[50%] email-right flex justify-center items-center">
        <img :src="rightImg" alt="" class="w-[95%]" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.chinese-form {
  letter-spacing: 5px;
}

.email-right {
  border-radius: 0 100px 100px 0;
  border-top: 3px var(--white) solid !important;
  border-right: 3px var(--white) solid !important;
  border-bottom: 3px var(--white) solid !important;
}

.submit-btn {
  border: 0.5vh var(--black) solid !important;

  &::after {
    content: 'SUBMIT';

    text-align: center;
    font-size: 18px;
    line-height: 38px;

    position: absolute;
    top: -40%;
    left: -0.5vh;
    width: 100px;
    height: 48px;

    background-color: var(--white);
    border: 0.5vh var(--black) solid !important;
    border-radius: 999px;

    transition: all var(--motion-duration-base);
    cursor: pointer;
  }

  &:hover::after {
    top: -0.5vh;
  }
}

.form-input {
  border: 0.5vh var(--black) solid !important;

  &:focus {
    outline: none !important;
  }
}
</style>
