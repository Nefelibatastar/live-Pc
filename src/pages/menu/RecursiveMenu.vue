<template>
  <div>
    <template v-for="menu in menuList">
      <!-- 有子菜单：渲染 Submenu，并递归渲染子菜单 -->
      <Submenu v-if="menu.childrenProgramList && menu.childrenProgramList.length" :key="menu.id"
        :name="menu.programUrl">
        <template slot="title">
          <Icon type="ios-menu" :size="iconSize" />
          <span class="layout-text">{{ menu.programName }}</span>
        </template>
        <!-- 递归调用自身，传入子菜单列表 -->
        <RecursiveMenu :menuList="menu.childrenProgramList" />
      </Submenu>

      <!-- 无子菜单：渲染 Menu-item -->
      <Menu-item v-else :name="menu.programUrl">
      <Icon type="ios-menu" :size="iconSize" />
      <span class="layout-text">{{ menu.programName }}</span>
      </Menu-item>
    </template>
  </div>
</template>

<script>
export default {
  name: 'RecursiveMenu', 
  props: {
    menuList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    // 从父级（或根组件）继承 iconSize，或通过 provide/inject 传递
    iconSize() {
      return this.$parent.iconSize || 14; // 根据实际情况调整
    }
  }
};
</script>