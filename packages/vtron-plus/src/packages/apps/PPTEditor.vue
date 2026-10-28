<template>
  <div ref="appRef" class="ppt-app office-window" tabindex="0" @keydown="onKeyDown">
    <OfficeTitlebar class="ppt-titlebar" @close="guarded(() => win?.close())">
      <span class="app-mark" aria-hidden="true">P</span>
      <button class="quick-button" title="保存 Ctrl+S" aria-label="保存" @click="saveFile()">
        <Icon name="save" />
      </button>
      <button
        class="quick-button"
        title="撤销 Ctrl+Z"
        aria-label="撤销"
        :disabled="!undoStack.length"
        @click="undo"
      >
        <Icon name="undo" />
      </button>
      <button
        class="quick-button"
        title="重做 Ctrl+Y"
        aria-label="重做"
        :disabled="!redoStack.length"
        @click="redo"
      >
        <Icon name="redo" />
      </button>
      <input
        v-model="pres.title"
        class="document-name"
        aria-label="演示文稿名称"
        maxlength="100"
        @focus="beginChange"
        @blur="commitChange"
      />
      <span class="save-state">{{
        busy ? '正在保存…' : dirty ? '未保存' : filePath ? '已保存' : '新建演示文稿'
      }}</span>
      <button class="title-play" @click="startPresentation(0)"><Icon name="play" />放映</button>
    </OfficeTitlebar>

    <nav class="ribbon-tabs" role="tablist" aria-label="功能区">
      <button
        v-for="tab in tabs"
        :id="`ppt-tab-${tab}`"
        :key="tab"
        role="tab"
        :aria-selected="activeTab === tab"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </nav>
    <div class="ribbon" role="tabpanel" :aria-labelledby="`ppt-tab-${activeTab}`">
      <template v-if="activeTab === '文件'">
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="new" label="新建" @click="createNew" /><Tool
              icon="folder"
              label="打开"
              @click="openFileDialog"
            /><Tool icon="import" label="从电脑导入" @click="importRef?.click()" />
          </div>
          <span class="group-caption">演示文稿</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="save" label="保存" :disabled="busy" @click="saveFile()" /><Tool
              icon="save"
              label="另存为"
              @click="showSaveAs"
            /><Tool icon="download" label="导出 PPTX" @click="download('pptx')" /><Tool
              icon="download"
              label="导出 VTPPT"
              @click="download('vtppt')"
            />
          </div>
          <span class="group-caption">保存与导出</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row"><Tool icon="print" label="打印 / PDF" @click="printSlides" /></div>
          <span class="group-caption">打印</span>
        </div>
      </template>
      <template v-else-if="activeTab === '开始'">
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="paste" label="粘贴" :disabled="!clipboardEl" @click="pasteElement" />
            <div class="small-tools">
              <button :disabled="!selectedEl" @click="copyElement(false)"><Icon name="copy" />复制</button
              ><button :disabled="!selectedEl" @click="copyElement(true)"><Icon name="cut" />剪切</button>
            </div>
          </div>
          <span class="group-caption">剪贴板</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="newSlide" label="新建幻灯片" @click="addSlide" />
            <div class="small-tools">
              <label
                >版式<select v-model="layout">
                  <option value="title">标题幻灯片</option>
                  <option value="content">标题和内容</option>
                  <option value="two">两栏内容</option>
                  <option value="blank">空白</option>
                </select></label
              ><button @click="resetLayout">应用版式</button>
            </div>
          </div>
          <span class="group-caption">幻灯片</span>
        </div>
        <div class="ribbon-group font-group">
          <div class="ribbon-row">
            <select
              :value="selectedEl?.fontFamily || 'Arial'"
              aria-label="字体"
              :disabled="!selectedText"
              @change="format('fontFamily', inputValue($event))"
            >
              <option>Arial</option>
              <option>Calibri</option>
              <option>Microsoft YaHei</option>
              <option>SimSun</option>
              <option>Georgia</option></select
            ><select
              :value="selectedEl?.fontSize || 28"
              aria-label="字号"
              :disabled="!selectedText"
              @change="format('fontSize', Number(inputValue($event)))"
            >
              <option v-for="size in fontSizes" :key="size">{{ size }}</option>
            </select>
          </div>
          <div class="ribbon-row">
            <button
              class="format-button"
              :class="{ chosen: selectedEl?.bold }"
              :disabled="!selectedText"
              title="加粗 Ctrl+B"
              @mousedown.prevent
              @click="format('bold', !selectedEl?.bold)"
            >
              <b>B</b></button
            ><button
              class="format-button"
              :class="{ chosen: selectedEl?.italic }"
              :disabled="!selectedText"
              title="斜体 Ctrl+I"
              @mousedown.prevent
              @click="format('italic', !selectedEl?.italic)"
            >
              <i>I</i></button
            ><button
              class="format-button"
              :class="{ chosen: selectedEl?.underline }"
              :disabled="!selectedText"
              title="下划线 Ctrl+U"
              @mousedown.prevent
              @click="format('underline', !selectedEl?.underline)"
            >
              <u>U</u></button
            ><label class="color-tool" title="文字颜色"
              >A<input
                type="color"
                aria-label="文字颜色"
                :value="selectedEl?.color || '#333333'"
                :disabled="!selectedText"
                @change="format('color', inputValue($event))"
            /></label>
          </div>
          <span class="group-caption">字体</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <button
              v-for="align in alignments"
              :key="align.value"
              class="format-button"
              :title="align.label"
              :aria-label="align.label"
              :class="{ chosen: selectedEl?.textAlign === align.value }"
              :disabled="!selectedText"
              @click="format('textAlign', align.value)"
            >
              <Icon :name="align.icon" />
            </button>
          </div>
          <div class="ribbon-row">
            <button :disabled="!selectedText" @click="toggleBullets">项目符号</button
            ><button
              :disabled="!selectedText"
              @click="format('fontSize', Math.min(240, (selectedEl?.fontSize || 28) + 2))"
            >
              增大字号
            </button>
          </div>
          <span class="group-caption">段落</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="delete" label="删除对象" :disabled="!selectedEl" @click="deleteElement" /><Tool
              icon="copy"
              label="复制对象"
              :disabled="!selectedEl"
              @click="duplicateElement"
            />
          </div>
          <span class="group-caption">编辑</span>
        </div>
      </template>
      <template v-else-if="activeTab === '插入'">
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="text" label="文本框" @click="addTextBox" /><Tool
              icon="image"
              label="图片"
              @click="imageRef?.click()"
            />
          </div>
          <span class="group-caption">文本与图片</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row shape-picker">
            <button v-for="shape in shapes" :key="shape.value" @click="addShape(shape.value)">
              <span :class="['shape-sample', shape.value]"></span>{{ shape.label }}
            </button>
          </div>
          <span class="group-caption">形状</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="number" label="页码" @click="addPageNumbers" /><Tool
              icon="notes"
              label="备注"
              @click="showNotes = !showNotes"
            />
          </div>
          <span class="group-caption">页面信息</span>
        </div>
      </template>
      <template v-else-if="activeTab === '设计'">
        <div class="ribbon-group">
          <div class="ribbon-row themes">
            <button
              v-for="theme in themes"
              :key="theme.name"
              :style="{ background: theme.background, color: theme.foreground }"
              @click="applyTheme(theme)"
            >
              <strong>Aa</strong><span>{{ theme.name }}</span>
            </button>
          </div>
          <span class="group-caption">应用到所有幻灯片</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <label class="setting-label"
              >背景颜色<input
                type="color"
                :value="currentSlide.backgroundColor"
                @change="changeSlide('backgroundColor', inputValue($event))" /></label
            ><label class="setting-label"
              >幻灯片大小<select
                :value="pres.width / pres.height > 1.6 ? 'wide' : 'standard'"
                @change="setSize(inputValue($event))"
              >
                <option value="wide">宽屏 16:9</option>
                <option value="standard">标准 4:3</option>
              </select></label
            >
          </div>
          <span class="group-caption">页面设置</span>
        </div>
      </template>
      <template v-else-if="activeTab === '切换'">
        <div class="ribbon-group">
          <div class="ribbon-row transition-options">
            <button
              v-for="transition in transitions"
              :key="transition.value"
              :class="{ chosen: (currentSlide.transition || 'none') === transition.value }"
              @click="changeSlide('transition', transition.value)"
            >
              <span :class="['transition-sample', transition.value]"></span>{{ transition.label }}
            </button>
          </div>
          <span class="group-caption">切换到此幻灯片</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="play" label="预览" @click="startPresentation(curIdx)" /><Tool
              icon="apply"
              label="全部应用"
              @click="applyTransitions"
            />
          </div>
          <span class="group-caption">切换选项</span>
        </div>
      </template>
      <template v-else-if="activeTab === '放映'">
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="play" label="从头开始" title="F5" @click="startPresentation(0)" /><Tool
              icon="play"
              label="从当前页开始"
              title="Shift+F5"
              @click="startPresentation(curIdx)"
            />
          </div>
          <span class="group-caption">开始放映</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <label class="setting-label"
              ><input v-model="presenterNotes" type="checkbox" /> 显示演讲备注</label
            ><label class="setting-label"><input v-model="autoAdvance" type="checkbox" /> 自动换页</label
            ><label v-if="autoAdvance" class="setting-label"
              >间隔<input
                v-model.number="advanceSeconds"
                type="number"
                min="2"
                max="120"
                aria-label="自动换页秒数"
              />秒</label
            >
          </div>
          <span class="group-caption">放映设置</span>
        </div>
      </template>
      <template v-else>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="slides" label="普通视图" :active="!sorter" @click="sorter = false" /><Tool
              icon="grid"
              label="幻灯片浏览"
              :active="sorter"
              @click="sorter = true"
            /><Tool icon="notes" label="备注" :active="showNotes" @click="showNotes = !showNotes" />
          </div>
          <span class="group-caption">视图</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <Tool icon="fit" label="适合窗口" @click="fitCanvas" /><label class="setting-label"
              >缩放<input
                type="range"
                min="25"
                max="150"
                :value="zoom"
                @input="setZoom(Number(inputValue($event)))"
              /><span>{{ zoom }}%</span></label
            >
          </div>
          <span class="group-caption">显示比例</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-row">
            <label><input v-model="showGrid" type="checkbox" /> 网格线</label
            ><label><input v-model="snapGrid" type="checkbox" /> 对齐网格</label>
          </div>
          <span class="group-caption">辅助线</span>
        </div>
      </template>
    </div>

    <div class="main-area">
      <aside v-if="!sorter" class="slide-list" aria-label="幻灯片列表">
        <div
          v-for="(slide, index) in pres.slides"
          :key="slide.id"
          class="thumb-wrap"
          :class="{ active: curIdx === index }"
          draggable="true"
          @dragstart="dragSlide = index"
          @dragover.prevent
          @drop.prevent="dropSlide(index)"
        >
          <span class="thumb-number">{{ index + 1 }}</span>
          <button
            class="thumb-button"
            :aria-label="`幻灯片 ${index + 1}，${slideTitle(slide)}`"
            :aria-current="curIdx === index ? 'true' : undefined"
            @click="selectSlide(index)"
          >
            <div
              class="thumb-frame"
              :style="{ width: `${thumbWidth}px`, height: `${(thumbWidth * pres.height) / pres.width}px` }"
            >
              <div
                class="slide-surface thumbnail-surface"
                :style="surfaceStyle(slide, thumbWidth / pres.width)"
              >
                <div
                  v-for="el in slide.elements"
                  :key="el.id"
                  class="slide-element"
                  :style="elementStyle(el)"
                >
                  <img v-if="el.type === 'image'" :src="el.content" alt="" draggable="false" />
                  <div v-else class="element-text">{{ el.content }}</div>
                </div>
              </div>
            </div>
          </button>
        </div>
        <button class="add-slide-button" @click="addSlide"><Icon name="add" />新建幻灯片</button>
        <div class="slide-order-actions">
          <button :disabled="curIdx === 0" title="幻灯片上移" aria-label="幻灯片上移" @click="moveSlide(-1)">
            ↑</button
          ><button
            :disabled="curIdx === pres.slides.length - 1"
            title="幻灯片下移"
            aria-label="幻灯片下移"
            @click="moveSlide(1)"
          >
            ↓</button
          ><button title="复制幻灯片" aria-label="复制幻灯片" @click="duplicateSlide">
            <Icon name="copy" /></button
          ><button
            :disabled="pres.slides.length === 1"
            title="删除幻灯片"
            aria-label="删除幻灯片"
            @click="deleteSlide"
          >
            <Icon name="delete" />
          </button>
        </div>
      </aside>
      <div v-if="sorter" class="slide-sorter">
        <div
          v-for="(slide, index) in pres.slides"
          :key="slide.id"
          class="sorter-item"
          :class="{ active: curIdx === index }"
          draggable="true"
          @dragstart="dragSlide = index"
          @dragover.prevent
          @drop.prevent="dropSlide(index)"
        >
          <button class="thumb-button" @click="selectSlide(index)" @dblclick="sorter = false">
            <div
              class="thumb-frame"
              :style="{ width: '240px', height: `${(240 * pres.height) / pres.width}px` }"
            >
              <div class="slide-surface thumbnail-surface" :style="surfaceStyle(slide, 240 / pres.width)">
                <div
                  v-for="el in slide.elements"
                  :key="el.id"
                  class="slide-element"
                  :style="elementStyle(el)"
                >
                  <img v-if="el.type === 'image'" :src="el.content" alt="" draggable="false" />
                  <div v-else class="element-text">{{ el.content }}</div>
                </div>
              </div>
            </div></button
          ><span>{{ index + 1 }} · {{ slideTitle(slide) }}</span>
        </div>
      </div>
      <section v-else class="workspace">
        <div ref="editorAreaRef" class="editor-area" @pointerdown.self="deselect">
          <div
            class="canvas-box"
            :style="{ width: `${pres.width * canvasScale}px`, height: `${pres.height * canvasScale}px` }"
          >
            <div
              ref="canvasRef"
              class="slide-surface slide-canvas"
              :class="{ 'with-grid': showGrid }"
              :style="surfaceStyle(currentSlide, canvasScale)"
              @pointerdown.self="deselect"
            >
              <div
                v-for="el in currentSlide.elements"
                :key="el.id"
                class="slide-element editable-element"
                :class="{ selected: selectedId === el.id, 'is-editing': editingId === el.id }"
                :style="elementStyle(el)"
                :data-object-id="el.id"
                @pointerdown.stop="onElementPointerDown(el, $event)"
                @dblclick.stop="startEditing(el)"
              >
                <img v-if="el.type === 'image'" :src="el.content" alt="幻灯片图片" draggable="false" />
                <textarea
                  v-else-if="editingId === el.id"
                  v-model="editText"
                  class="element-editor"
                  aria-label="编辑幻灯片文本"
                  @pointerdown.stop
                  @input="updateTextDraft"
                  @blur="finishEditing"
                  @keydown.escape.prevent="finishEditing"
                ></textarea>
                <div v-else class="element-text">{{ el.content }}</div>
                <template v-if="selectedId === el.id && editingId !== el.id"
                  ><span
                    v-for="corner in corners"
                    :key="corner"
                    :class="['resize-handle', corner]"
                    @pointerdown.stop="onResizeStart(el, corner, $event)"
                  ></span
                ></template>
              </div>
            </div>
          </div>
        </div>
        <div v-if="showNotes" class="notes-panel">
          <label for="ppt-slide-notes">备注</label
          ><textarea
            id="ppt-slide-notes"
            :value="currentSlide.notes || ''"
            placeholder="单击此处添加备注"
            @focus="beginChange"
            @input="currentSlide.notes = inputValue($event)"
            @blur="commitChange"
          ></textarea>
        </div>
      </section>
      <aside v-if="selectedEl && !sorter" class="format-pane" aria-label="对象格式">
        <div class="pane-title">
          <strong>{{ selectedEl.type === 'image' ? '图片格式' : '对象格式' }}</strong
          ><button title="关闭格式面板" aria-label="关闭格式面板" @click="deselect">×</button>
        </div>
        <div class="property-fields">
          <label
            >X<input
              type="number"
              :value="Math.round(selectedEl.x)"
              @change="format('x', numberValue($event, -5000, 5000))" /></label
          ><label
            >Y<input
              type="number"
              :value="Math.round(selectedEl.y)"
              @change="format('y', numberValue($event, -5000, 5000))" /></label
          ><label
            >宽度<input
              type="number"
              :value="Math.round(selectedEl.width)"
              min="8"
              @change="format('width', numberValue($event, 8, 5000))" /></label
          ><label
            >高度<input
              type="number"
              :value="Math.round(selectedEl.height)"
              min="4"
              @change="format('height', numberValue($event, 4, 5000))"
          /></label>
        </div>
        <label class="pane-property"
          >旋转<input
            type="number"
            :value="selectedEl.rotation || 0"
            min="-360"
            max="360"
            @change="format('rotation', numberValue($event, -360, 360))"
          />°</label
        >
        <template v-if="selectedEl.type !== 'image'"
          ><label class="pane-property"
            >填充<input
              type="color"
              :value="selectedEl.backgroundColor === 'transparent' ? '#ffffff' : selectedEl.backgroundColor"
              @change="format('backgroundColor', inputValue($event))" /></label
          ><button class="pane-button" @click="format('backgroundColor', 'transparent')">无填充</button
          ><label class="pane-property"
            >轮廓<input
              type="color"
              :value="
                selectedEl.borderColor === 'transparent' ? '#000000' : selectedEl.borderColor || '#000000'
              "
              @change="setBorder(inputValue($event))" /></label
          ><label class="pane-property"
            >线宽<input
              type="number"
              :value="selectedEl.borderWidth || 0"
              min="0"
              max="24"
              @change="format('borderWidth', numberValue($event, 0, 24))" /></label
        ></template>
        <div class="pane-divider"></div>
        <strong class="pane-section">排列</strong>
        <div class="pane-buttons">
          <button @click="reorderElement('front')">置于顶层</button
          ><button @click="reorderElement('back')">置于底层</button
          ><button @click="alignObject('horizontal')">水平居中</button
          ><button @click="alignObject('vertical')">垂直居中</button
          ><button @click="duplicateElement">复制对象</button><button @click="deleteElement">删除对象</button>
        </div>
      </aside>
    </div>
    <footer class="status-bar">
      <span>幻灯片 {{ curIdx + 1 }} / {{ pres.slides.length }}</span
      ><span class="status-message" role="status">{{ notice }}</span
      ><button :class="{ chosen: showNotes }" @click="showNotes = !showNotes">备注</button
      ><button title="普通视图" aria-label="普通视图" @click="sorter = false"><Icon name="slides" /></button
      ><button title="幻灯片浏览" aria-label="幻灯片浏览" @click="sorter = true"><Icon name="grid" /></button
      ><button title="从当前页放映" aria-label="从当前页放映" @click="startPresentation(curIdx)">
        <Icon name="play" /></button
      ><button aria-label="缩小" @click="setZoom(zoom - 10)">−</button
      ><input
        type="range"
        min="25"
        max="150"
        :value="zoom"
        aria-label="画布缩放"
        @input="setZoom(Number(inputValue($event)))"
      /><span>{{ zoom }}%</span><button aria-label="放大" @click="setZoom(zoom + 10)">+</button
      ><button title="适合窗口" aria-label="适合窗口" @click="fitCanvas"><Icon name="fit" /></button>
    </footer>

    <input
      ref="importRef"
      type="file"
      accept=".vtppt,.pptx,application/json"
      hidden
      @change="importLocalFile"
    /><input
      ref="imageRef"
      type="file"
      accept="image/png,image/jpeg,image/gif"
      hidden
      @change="insertImage"
    />
    <div v-if="fileDialog" class="modal-backdrop" @mousedown.self="fileDialog = null">
      <form
        class="file-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="fileDialog === 'open' ? '打开演示文稿' : '另存为'"
        @submit.prevent="submitFileDialog"
      >
        <div class="dialog-heading">
          <h2>{{ fileDialog === 'open' ? '打开演示文稿' : '另存为' }}</h2>
          <button type="button" aria-label="关闭对话框" @click="fileDialog = null">×</button>
        </div>
        <label
          >{{ fileDialog === 'open' ? 'Vtron 文件路径' : '保存路径（.vtppt）'
          }}<input v-model="dialogPath" autofocus required placeholder="/C/Users/Desktop/演示文稿.vtppt"
        /></label>
        <div v-if="fileDialog === 'open'" class="recent-files">
          <button
            v-for="file in availableFiles"
            :key="file"
            type="button"
            :class="{ chosen: dialogPath === file }"
            @click="dialogPath = file"
          >
            <Icon name="slides" />{{ file.split('/').pop() }}</button
          ><span v-if="!availableFiles.length">桌面还没有演示文稿</span>
        </div>
        <p v-if="dialogError" class="dialog-error" role="alert">{{ dialogError }}</p>
        <footer>
          <button type="button" @click="fileDialog = null">取消</button
          ><button class="primary-button" type="submit" :disabled="busy">
            {{ fileDialog === 'open' ? '打开' : '保存' }}
          </button>
        </footer>
      </form>
    </div>
    <div v-if="confirmAction" class="modal-backdrop">
      <div class="file-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-label="未保存的更改">
        <h2>保留当前更改？</h2>
        <p>当前演示文稿有未保存的更改。</p>
        <footer>
          <button @click="confirmAction = null">取消</button><button @click="discardChanges">不保存</button
          ><button class="primary-button" @click="saveAndContinue">保存</button>
        </footer>
      </div>
    </div>
    <div v-if="loading" class="modal-backdrop">
      <div class="file-dialog" role="status" aria-live="polite">正在打开演示文稿…</div>
    </div>
    <div v-if="draft" class="draft-bar" role="status">
      发现未保存的演示文稿<button @click="restoreDraft">恢复</button
      ><button @click="discardDraft">忽略</button>
    </div>

    <div
      v-if="presenting"
      ref="presRef"
      class="presentation-overlay"
      tabindex="0"
      @click="nextSlide"
      @keydown.stop="onPresentationKey"
    >
      <div class="presentation-stage">
        <Transition :name="presentationTransition" mode="out-in"
          ><div
            :key="presentationIndex"
            class="slide-surface presentation-slide"
            :style="surfaceStyle(presentationSlide, presentationScale)"
          >
            <div
              v-for="el in presentationSlide.elements"
              :key="el.id"
              class="slide-element"
              :style="elementStyle(el)"
            >
              <img v-if="el.type === 'image'" :src="el.content" alt="" draggable="false" />
              <div v-else class="element-text">{{ el.content }}</div>
            </div>
          </div></Transition
        >
      </div>
      <div class="presentation-controls" @click.stop>
        <button aria-label="上一张" :disabled="presentationIndex === 0" @click="presentationIndex--">‹</button
        ><span>{{ presentationIndex + 1 }} / {{ pres.slides.length }}</span
        ><button aria-label="下一张" @click="nextSlide">›</button
        ><button @click="stopPresentation">结束放映</button>
      </div>
      <div v-if="presenterNotes && presentationSlide.notes" class="presentation-notes" @click.stop>
        {{ presentationSlide.notes }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { BrowserWindow, System, join } from 'vtron';
import OfficeTitlebar from './office/OfficeTitlebar.vue';
import { downloadPptFile, exportPptx, importPptx, normalizePresentation, pptId } from './office/pptFile';
import type { Presentation, Slide, SlideElement } from './office/pptFile';

const iconPaths: Record<string, string> = {
  save: 'M4 3h14l3 3v15H3V3h1Zm3 0v6h10V3M7 21v-8h10v8',
  undo: 'M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12',
  redo: 'm16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12',
  play: 'm8 4 13 8-13 8V4Z',
  new: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 14h8m-4-4v8',
  folder: 'M3 6h7l2 3h9v12H3V6Z',
  import: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  print: 'M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v8H6v-8Z',
  paste: 'M9 4H5v18h14V4h-4M9 2h6v5H9V2Z',
  copy: 'M8 8h13v13H8V8ZM3 16V3h13',
  cut: 'm6 4 12 16M18 4 6 20M7 17a3 3 0 1 0-4 4 3 3 0 0 0 4-4Zm14 0a3 3 0 1 0-4 4 3 3 0 0 0 4-4Z',
  newSlide: 'M3 5h18v15H3V5Zm0 5h18M8 1v8M4 5h8',
  delete: 'M3 6h18M9 6V3h6v3M6 6l1 16h10l1-16M10 10v8m4-8v8',
  text: 'M3 5V3h18v2M12 3v18m-4 0h8',
  image: 'M3 3h18v18H3V3Zm0 14 6-6 5 5 3-3 4 4M16 7h.01',
  number: 'M4 8h16M4 16h16M10 3 7 22M17 3l-3 19',
  notes: 'M4 3h16v18H4V3Zm4 5h8m-8 4h8m-8 4h5',
  add: 'M12 3v18M3 12h18',
  apply: 'm4 12 5 5L21 5',
  slides: 'M3 4h18v16H3V4Zm5 0v16M3 9h5m-5 5h5',
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  fit: 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6M8 8h8v8H8V8Z',
  left: 'M3 4h18M3 9h12M3 14h18M3 19h12',
  center: 'M3 4h18M6 9h12M3 14h18M6 19h12',
  right: 'M3 4h18M9 9h12M3 14h18M9 19h12',
};
const Icon = defineComponent({
  props: { name: { type: String, required: true } },
  setup: (props) => () =>
    h(
      'svg',
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      [h('path', { d: iconPaths[props.name] || iconPaths.slides })]
    ),
});
const Tool = defineComponent({
  props: { icon: String, label: String, title: String, disabled: Boolean, active: Boolean },
  emits: ['click'],
  setup:
    (props, { emit }) =>
    () =>
      h(
        'button',
        {
          class: ['ribbon-tool', { chosen: props.active }],
          title: props.title || props.label,
          disabled: props.disabled,
          onMousedown: (e: MouseEvent) => e.preventDefault(),
          onClick: () => emit('click'),
        },
        [h(Icon, { name: props.icon || 'slides' }), h('span', props.label)]
      ),
});
const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const appRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const editorAreaRef = ref<HTMLElement | null>(null);
const presRef = ref<HTMLElement | null>(null);
const importRef = ref<HTMLInputElement | null>(null);
const imageRef = ref<HTMLInputElement | null>(null);
const tabs = ['文件', '开始', '插入', '设计', '切换', '放映', '视图'];
const activeTab = ref('开始');
const layout = ref('title');
const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 96, 120, 144];
const alignments = [
  { value: 'left', label: '左对齐', icon: 'left' },
  { value: 'center', label: '居中', icon: 'center' },
  { value: 'right', label: '右对齐', icon: 'right' },
];
const corners = ['nw', 'ne', 'sw', 'se'];
const shapes: { value: NonNullable<SlideElement['shape']>; label: string }[] = [
  { value: 'rect', label: '矩形' },
  { value: 'roundRect', label: '圆角矩形' },
  { value: 'ellipse', label: '椭圆' },
  { value: 'triangle', label: '三角形' },
  { value: 'line', label: '直线' },
];
const themes = [
  { name: '简洁', background: '#ffffff', foreground: '#20242c', accent: '#c43e1c' },
  { name: '深蓝', background: '#14243b', foreground: '#ffffff', accent: '#77b9ff' },
  { name: '暖白', background: '#fff8ef', foreground: '#593625', accent: '#b34b2d' },
  { name: '森林', background: '#edf4ee', foreground: '#234a38', accent: '#2b7853' },
  { name: '深色', background: '#222222', foreground: '#ffffff', accent: '#ffb36c' },
];
const transitions = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡化' },
  { value: 'push', label: '推进' },
];
const inputValue = (event: Event) => (event.target as HTMLInputElement).value;
const numberValue = (event: Event, min: number, max: number) =>
  Math.min(max, Math.max(min, Number(inputValue(event)) || 0));
function textElement(
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize = 28,
  bold = false
): SlideElement {
  return {
    id: pptId(),
    type: 'text',
    x,
    y,
    width,
    height,
    content,
    fontSize,
    fontFamily: 'Arial',
    bold,
    italic: false,
    underline: false,
    color: '#20242c',
    textAlign: 'left',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    rotation: 0,
  };
}
function makeSlide(kind = layout.value): Slide {
  const elements: SlideElement[] = [];
  if (kind === 'title') {
    const title = textElement('单击此处添加标题', 100, 150, 760, 100, 52, true);
    title.textAlign = 'center';
    const subtitle = textElement('单击此处添加副标题', 160, 285, 640, 70, 26);
    subtitle.textAlign = 'center';
    subtitle.color = '#68717c';
    elements.push(title, subtitle);
  } else if (kind === 'content' || kind === 'two') {
    elements.push(textElement('单击此处添加标题', 64, 42, 832, 75, 40, true));
    elements.push(textElement('单击此处添加内容', 64, 155, kind === 'two' ? 395 : 832, 300, 26));
    if (kind === 'two') elements.push(textElement('单击此处添加内容', 500, 155, 395, 300, 26));
  }
  return { id: pptId(), backgroundColor: '#ffffff', elements, notes: '', transition: 'none' };
}
const pres = reactive<Presentation>({
  title: '演示文稿',
  width: 960,
  height: 540,
  slides: [makeSlide('title')],
});
const curIdx = ref(0),
  selectedId = ref<string | null>(null),
  editingId = ref<string | null>(null),
  editText = ref('');
const currentSlide = computed(() => pres.slides[Math.min(curIdx.value, pres.slides.length - 1)]);
const selectedEl = computed(
  () => currentSlide.value.elements.find((el) => el.id === selectedId.value) || null
);
const selectedText = computed(() => selectedEl.value && selectedEl.value.type !== 'image');
const filePath = ref(''),
  savedSnapshot = ref(JSON.stringify(pres)),
  busy = ref(false),
  loading = ref(false),
  notice = ref('');
const dirty = computed(() => JSON.stringify(pres) !== savedSnapshot.value);
const undoStack = ref<string[]>([]),
  redoStack = ref<string[]>([]);
let beforeChange = '';
function snapshot() {
  return JSON.stringify(pres);
}
function beginChange() {
  if (!beforeChange) beforeChange = snapshot();
}
function commitChange() {
  if (beforeChange && beforeChange !== snapshot()) {
    undoStack.value.push(beforeChange);
    if (undoStack.value.length > 60) undoStack.value.shift();
    redoStack.value = [];
  }
  beforeChange = '';
}
function change(action: () => void) {
  cleanupPointer?.();
  finishEditing();
  beginChange();
  action();
  commitChange();
}
function replaceState(source: string) {
  const data = JSON.parse(source) as Presentation;
  Object.assign(pres, data);
  curIdx.value = Math.min(curIdx.value, pres.slides.length - 1);
  selectedId.value = null;
  editingId.value = null;
  beforeChange = '';
}
function undo() {
  cleanupPointer?.();
  finishEditing();
  const previous = undoStack.value.pop();
  if (!previous) return;
  redoStack.value.push(snapshot());
  replaceState(previous);
}
function redo() {
  cleanupPointer?.();
  finishEditing();
  const next = redoStack.value.pop();
  if (!next) return;
  undoStack.value.push(snapshot());
  replaceState(next);
}
function tell(message: string) {
  notice.value = message;
}
watch(
  () => pres.title,
  () => {
    if (win) win.windowInfo.title = `${pres.title || '演示文稿'} — PowerPoint`;
  }
);
function elementStyle(el: SlideElement): Record<string, string> {
  const style: Record<string, string> = {
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
    fontSize: `${el.fontSize}px`,
    fontFamily: el.fontFamily || 'Arial',
    fontWeight: el.bold ? '700' : '400',
    fontStyle: el.italic ? 'italic' : 'normal',
    textDecoration: el.underline ? 'underline' : 'none',
    color: el.color,
    textAlign: el.textAlign,
    backgroundColor: el.backgroundColor || 'transparent',
    border: `${el.borderWidth || 0}px solid ${el.borderColor || 'transparent'}`,
    transform: `rotate(${el.rotation || 0}deg)`,
    borderRadius:
      el.type === 'shape' && el.shape === 'ellipse'
        ? '50%'
        : el.type === 'shape' && el.shape === 'roundRect'
          ? '18px'
          : '0',
  };
  if (el.type === 'shape' && el.shape === 'triangle') {
    const triangle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,1 99,99 1,99" fill="${el.backgroundColor === 'transparent' ? 'none' : el.backgroundColor}" stroke="${el.borderColor === 'transparent' ? 'none' : el.borderColor || 'none'}" stroke-width="${el.borderWidth || 0}"/></svg>`;
    style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(triangle)}")`;
    style.backgroundSize = '100% 100%';
    style.backgroundColor = 'transparent';
    style.border = 'none';
  }
  if (el.type === 'shape' && el.shape === 'line') {
    style.height = '0';
    style.backgroundColor = 'transparent';
    style.border = 'none';
    style.borderTop = `${el.borderWidth || 3}px solid ${el.borderColor === 'transparent' ? '#c43e1c' : el.borderColor || '#c43e1c'}`;
  }
  return style;
}
function surfaceStyle(slide: Slide, scale: number) {
  return {
    width: `${pres.width}px`,
    height: `${pres.height}px`,
    transform: `scale(${scale})`,
    backgroundColor: slide.backgroundColor,
  };
}
function slideTitle(slide: Slide) {
  return (
    slide.elements.find((el) => el.type !== 'image' && el.content.trim())?.content.slice(0, 30) ||
    '空白幻灯片'
  );
}
function deselect() {
  finishEditing();
  selectedId.value = null;
}
function selectSlide(index: number) {
  finishEditing();
  curIdx.value = index;
  selectedId.value = null;
}
function addSlide() {
  change(() => {
    const slide = makeSlide();
    if (pres.width !== 960 || pres.height !== 540)
      slide.elements.forEach((el) => {
        el.x *= pres.width / 960;
        el.width *= pres.width / 960;
        el.y *= pres.height / 540;
        el.height *= pres.height / 540;
      });
    pres.slides.splice(curIdx.value + 1, 0, slide);
    curIdx.value++;
    selectedId.value = null;
  });
}
function deleteSlide() {
  if (pres.slides.length === 1) return;
  change(() => {
    pres.slides.splice(curIdx.value, 1);
    curIdx.value = Math.min(curIdx.value, pres.slides.length - 1);
    selectedId.value = null;
  });
}
function duplicateSlide() {
  change(() => {
    const slide = JSON.parse(JSON.stringify(currentSlide.value)) as Slide;
    slide.id = pptId();
    slide.elements.forEach((el) => (el.id = pptId()));
    pres.slides.splice(curIdx.value + 1, 0, slide);
    curIdx.value++;
    selectedId.value = null;
  });
}
function moveSlide(delta: number) {
  const target = curIdx.value + delta;
  if (target < 0 || target >= pres.slides.length) return;
  change(() => {
    const [slide] = pres.slides.splice(curIdx.value, 1);
    pres.slides.splice(target, 0, slide);
    curIdx.value = target;
  });
}
const dragSlide = ref<number | null>(null);
function dropSlide(index: number) {
  const source = dragSlide.value;
  dragSlide.value = null;
  if (source === null || source === index) return;
  change(() => {
    const [slide] = pres.slides.splice(source, 1);
    pres.slides.splice(index, 0, slide);
    curIdx.value = index;
    selectedId.value = null;
  });
}
function resetLayout() {
  if (currentSlide.value.elements.length && !window.confirm('应用版式会替换当前页的对象，是否继续？')) return;
  change(() => {
    const slide = makeSlide();
    slide.elements.forEach((el) => {
      el.x *= pres.width / 960;
      el.width *= pres.width / 960;
      el.y *= pres.height / 540;
      el.height *= pres.height / 540;
    });
    currentSlide.value.elements = slide.elements;
    selectedId.value = null;
  });
}
function addTextBox() {
  change(() => {
    const el = textElement('双击编辑文本', pres.width * 0.2, pres.height * 0.35, 360, 90);
    currentSlide.value.elements.push(el);
    selectedId.value = el.id;
  });
}
function addShape(shape: NonNullable<SlideElement['shape']>) {
  change(() => {
    const el = textElement('', pres.width * 0.35, pres.height * 0.3, 220, shape === 'line' ? 4 : 140);
    el.type = 'shape';
    el.shape = shape;
    el.backgroundColor = shape === 'line' ? 'transparent' : '#d35230';
    el.color = '#ffffff';
    el.textAlign = 'center';
    el.borderColor = shape === 'line' ? '#d35230' : 'transparent';
    el.borderWidth = shape === 'line' ? 3 : 0;
    currentSlide.value.elements.push(el);
    selectedId.value = el.id;
  });
}
function deleteElement() {
  if (!selectedId.value) return;
  change(() => {
    currentSlide.value.elements = currentSlide.value.elements.filter((el) => el.id !== selectedId.value);
    selectedId.value = null;
  });
}
const clipboardEl = ref<SlideElement | null>(null);
function copyElement(cut: boolean) {
  finishEditing();
  if (!selectedEl.value) return;
  clipboardEl.value = JSON.parse(JSON.stringify(selectedEl.value));
  if (cut) deleteElement();
  else tell('已复制对象');
}
function pasteElement() {
  if (!clipboardEl.value) return;
  change(() => {
    const el = JSON.parse(JSON.stringify(clipboardEl.value)) as SlideElement;
    el.id = pptId();
    el.x += 20;
    el.y += 20;
    currentSlide.value.elements.push(el);
    selectedId.value = el.id;
    clipboardEl.value = JSON.parse(JSON.stringify(el));
  });
}
function duplicateElement() {
  copyElement(false);
  pasteElement();
}
function format(key: keyof SlideElement, value: SlideElement[keyof SlideElement]) {
  if (!selectedEl.value) return;
  change(() => {
    Object.assign(selectedEl.value!, { [key]: value });
  });
}
function setBorder(value: string) {
  change(() => {
    if (selectedEl.value) {
      selectedEl.value.borderColor = value;
      selectedEl.value.borderWidth = selectedEl.value.borderWidth || 1;
    }
  });
}
function reorderElement(direction: 'front' | 'back') {
  change(() => {
    const elements = currentSlide.value.elements;
    const index = elements.findIndex((el) => el.id === selectedId.value);
    if (index < 0) return;
    const [el] = elements.splice(index, 1);
    direction === 'front' ? elements.push(el) : elements.unshift(el);
  });
}
function alignObject(axis: 'horizontal' | 'vertical') {
  if (!selectedEl.value) return;
  format(
    axis === 'horizontal' ? 'x' : 'y',
    axis === 'horizontal'
      ? (pres.width - selectedEl.value.width) / 2
      : (pres.height - selectedEl.value.height) / 2
  );
}
function toggleBullets() {
  if (!selectedEl.value) return;
  const lines = selectedEl.value.content.split('\n');
  const remove = lines.every((line) => line.startsWith('• '));
  format('content', lines.map((line) => (remove ? line.replace(/^• /, '') : '• ' + line)).join('\n'));
}
function changeSlide(key: 'backgroundColor' | 'transition', value: string) {
  change(() => Object.assign(currentSlide.value, { [key]: value }));
}
function applyTransitions() {
  change(() => pres.slides.forEach((slide) => (slide.transition = currentSlide.value.transition)));
}
function applyTheme(theme: (typeof themes)[number]) {
  change(() =>
    pres.slides.forEach((slide) => {
      slide.backgroundColor = theme.background;
      slide.elements.forEach((el) => {
        if (el.type === 'image') return;
        el.color = theme.foreground;
        if (el.type === 'shape' && el.backgroundColor !== 'transparent') {
          el.backgroundColor = theme.accent;
          el.color = '#ffffff';
        }
      });
    })
  );
}
function setSize(value: string) {
  change(() => {
    const newHeight = value === 'standard' ? 720 : 540;
    const ratio = newHeight / pres.height;
    pres.slides.forEach((slide) =>
      slide.elements.forEach((el) => {
        el.y *= ratio;
        el.height *= ratio;
      })
    );
    pres.height = newHeight;
    pres.width = 960;
  });
  nextTick(fitCanvas);
}
function addPageNumbers() {
  change(() =>
    pres.slides.forEach((slide, index) => {
      const el = textElement(String(index + 1), pres.width - 80, pres.height - 45, 50, 30, 16);
      el.textAlign = 'right';
      el.color = slide.backgroundColor === '#ffffff' ? '#68717c' : '#888888';
      slide.elements.push(el);
    })
  );
}
function startEditing(el: SlideElement) {
  if (el.type === 'image') return;
  finishEditing();
  selectedId.value = el.id;
  editingId.value = el.id;
  editText.value = el.content;
  beginChange();
  nextTick(() => {
    const editor = appRef.value?.querySelector<HTMLTextAreaElement>('.element-editor');
    editor?.focus();
    editor?.select();
  });
}
function updateTextDraft() {
  const el = currentSlide.value.elements.find((item) => item.id === editingId.value);
  if (el) el.content = editText.value;
}
function finishEditing() {
  if (!editingId.value) return;
  updateTextDraft();
  editingId.value = null;
  commitChange();
}
const snapGrid = ref(false),
  showGrid = ref(false);
const snapped = (value: number) => (snapGrid.value ? Math.round(value / 10) * 10 : Math.round(value));
let cleanupPointer: (() => void) | null = null;
function trackPointer(event: PointerEvent, move: (event: PointerEvent) => void) {
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture?.(event.pointerId);
  const finish = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', finish);
    target.removeEventListener('pointercancel', finish);
    target.removeEventListener('lostpointercapture', finish);
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
    cleanupPointer = null;
    commitChange();
  };
  cleanupPointer = finish;
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', finish);
  target.addEventListener('pointercancel', finish);
  target.addEventListener('lostpointercapture', finish);
}
function onElementPointerDown(el: SlideElement, event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary || editingId.value === el.id) return;
  finishEditing();
  selectedId.value = el.id;
  event.preventDefault();
  appRef.value?.focus({ preventScroll: true });
  cleanupPointer?.();
  beginChange();
  const startX = event.clientX,
    startY = event.clientY,
    ox = el.x,
    oy = el.y;
  trackPointer(event, (ev) => {
    el.x = snapped(
      Math.max(-el.width + 16, Math.min(pres.width - 16, ox + (ev.clientX - startX) / canvasScale.value))
    );
    el.y = snapped(
      Math.max(-el.height + 16, Math.min(pres.height - 16, oy + (ev.clientY - startY) / canvasScale.value))
    );
  });
}
function onResizeStart(el: SlideElement, corner: string, event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary) return;
  event.preventDefault();
  appRef.value?.focus({ preventScroll: true });
  cleanupPointer?.();
  beginChange();
  const sx = event.clientX,
    sy = event.clientY;
  const ox = el.x,
    oy = el.y,
    ow = el.width,
    oh = el.height;
  const radians = ((el.rotation || 0) * Math.PI) / 180;
  const cosine = Math.cos(radians),
    sine = Math.sin(radians);
  const horizontal = corner.endsWith('e') ? 1 : -1;
  const vertical = corner.startsWith('s') ? 1 : -1;
  trackPointer(event, (ev) => {
    const dx = (ev.clientX - sx) / canvasScale.value;
    const dy = (ev.clientY - sy) / canvasScale.value;
    const localX = dx * cosine + dy * sine;
    const localY = -dx * sine + dy * cosine;
    let width = Math.max(12, ow + horizontal * localX);
    let height = Math.max(8, oh + vertical * localY);
    if (ev.shiftKey) height = (width * oh) / ow;
    el.width = Math.max(12, snapped(width));
    el.height = Math.max(8, snapped(height));
    const centerX = (horizontal * (el.width - ow)) / 2;
    const centerY = (vertical * (el.height - oh)) / 2;
    el.x = snapped(ox + ow / 2 + centerX * cosine - centerY * sine - el.width / 2);
    el.y = snapped(oy + oh / 2 + centerX * sine + centerY * cosine - el.height / 2);
  });
}
async function insertImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = '';
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    tell('请选择 8 MB 以内的 PNG、JPEG 或 GIF');
    return;
  }
  try {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = data;
    });
    change(() => {
      const width = Math.min(image.naturalWidth, pres.width * 0.7),
        height = (width * image.naturalHeight) / image.naturalWidth;
      const fit = Math.min(1, (pres.height * 0.8) / height);
      const el = textElement(
        data,
        (pres.width - width * fit) / 2,
        (pres.height - height * fit) / 2,
        width * fit,
        height * fit
      );
      el.type = 'image';
      currentSlide.value.elements.push(el);
      selectedId.value = el.id;
    });
  } catch {
    tell('图片无法读取');
  }
}

const thumbWidth = ref(128);
const canvasScale = ref(0.7),
  zoom = ref(70),
  showNotes = ref(true),
  sorter = ref(false);
let fitMode = true;
function fitCanvas() {
  fitMode = true;
  const area = editorAreaRef.value;
  if (!area) return;
  canvasScale.value = Math.max(
    0.1,
    Math.min((area.clientWidth - 64) / pres.width, (area.clientHeight - 56) / pres.height, 1.25)
  );
  zoom.value = Math.round(canvasScale.value * 100);
}
function setZoom(value: number) {
  fitMode = false;
  zoom.value = Math.min(150, Math.max(25, value));
  canvasScale.value = zoom.value / 100;
}
watch([showNotes, sorter, selectedId], () =>
  nextTick(() => {
    if (fitMode) fitCanvas();
  })
);
const fileDialog = ref<'open' | 'save' | null>(null),
  dialogPath = ref(''),
  dialogError = ref(''),
  availableFiles = ref<string[]>([]);
const desktop = () => join(sys._options.userLocation || '/C/Users', 'Desktop');
const cleanName = () => (pres.title || '演示文稿').replace(/[\\/:*?"<>|]/g, '').trim() || '演示文稿';
const confirmAction = ref<null | (() => void | Promise<void>)>(null);
function guarded(action: () => void | Promise<void>) {
  if (busy.value || loading.value) {
    tell('正在处理文件，请稍后再切换演示文稿');
    return;
  }
  finishEditing();
  if (dirty.value) {
    confirmAction.value = action;
  } else void action();
}
function discardChanges() {
  const action = confirmAction.value;
  confirmAction.value = null;
  void action?.();
}
async function saveAndContinue() {
  if (await saveFile()) {
    if (dirty.value) {
      tell('保存期间还有新更改，请再次保存');
      return;
    }
    const action = confirmAction.value;
    confirmAction.value = null;
    await action?.();
  }
}
function createNew() {
  guarded(() => {
    Object.assign(pres, { title: '演示文稿', width: 960, height: 540, slides: [makeSlide('title')] });
    filePath.value = '';
    curIdx.value = 0;
    selectedId.value = null;
    undoStack.value = [];
    redoStack.value = [];
    beforeChange = '';
    savedSnapshot.value = snapshot();
    discardDraft();
    nextTick(fitCanvas);
  });
}
async function openFileDialog() {
  dialogPath.value = filePath.value || desktop() + '/';
  dialogError.value = '';
  fileDialog.value = 'open';
  try {
    availableFiles.value = (await sys.fs.readdir(desktop()))
      .filter((f) => !f.isDirectory && /\.(vtppt|pptx)$/i.test(f.name))
      .map((f) => join(desktop(), f.name));
  } catch {
    availableFiles.value = [];
  }
}
function showSaveAs() {
  finishEditing();
  dialogPath.value = filePath.value || join(desktop(), cleanName() + '.vtppt');
  dialogError.value = '';
  fileDialog.value = 'save';
}
async function submitFileDialog() {
  dialogError.value = '';
  const path = dialogPath.value.trim();
  if (!path.startsWith('/')) {
    dialogError.value = '请输入以 / 开头的 Vtron 文件路径';
    return;
  }
  if (fileDialog.value === 'open') {
    if (!/\.(vtppt|pptx)$/i.test(path)) {
      dialogError.value = '请选择 .vtppt 或 .pptx 文件';
      return;
    }
    fileDialog.value = null;
    guarded(() => loadFile(path));
  } else {
    if (!/\.vtppt$/i.test(path)) {
      dialogError.value = '保存路径需要以 .vtppt 结尾';
      return;
    }
    if (path !== filePath.value && (await sys.fs.exists(path)) && !window.confirm('文件已存在，是否替换？'))
      return;
    if (await saveFile(path)) fileDialog.value = null;
  }
}
async function saveFile(pathOverride?: string): Promise<boolean> {
  finishEditing();
  if (busy.value) return false;
  busy.value = true;
  try {
    let path = pathOverride || filePath.value;
    if (!path) {
      path = join(desktop(), cleanName() + '.vtppt');
      let i = 1;
      while (await sys.fs.exists(path)) path = join(desktop(), `${cleanName()} (${i++}).vtppt`);
    }
    const saved = snapshot();
    await sys.fs.writeFile(path, saved, { flag: pathOverride || filePath.value ? 'w' : 'wx' });
    filePath.value = path;
    savedSnapshot.value = saved;
    if (dirty.value) saveDraft();
    else discardDraft();
    tell(`已保存到 ${path}`);
    return true;
  } catch {
    tell('保存失败，请检查路径和剩余空间');
    return false;
  } finally {
    busy.value = false;
  }
}
async function decodeSource(source: string, path: string) {
  if (/\.pptx$/i.test(path)) {
    const base64 = source.startsWith('data:') ? source.slice(source.indexOf(',') + 1) : source;
    const binary = atob(base64.replace(/\s/g, ''));
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    return importPptx(buffer.buffer);
  }
  return { data: normalizePresentation(JSON.parse(source)), simplified: false };
}
function usePresentation(data: Presentation, path: string, imported = false) {
  Object.assign(pres, data);
  filePath.value = imported ? '' : path;
  curIdx.value = 0;
  selectedId.value = null;
  editingId.value = null;
  undoStack.value = [];
  redoStack.value = [];
  beforeChange = '';
  savedSnapshot.value = imported ? '' : snapshot();
  nextTick(fitCanvas);
}
async function loadFile(path: string) {
  if (loading.value) return;
  loading.value = true;
  appRef.value?.focus();
  try {
    const source = await sys.fs.readFile(path);
    if (!source) throw new Error('文件不存在或内容为空');
    const result = await decodeSource(source, path);
    if (!result.data.title || result.data.title === '导入的演示文稿')
      result.data.title = path
        .split('/')
        .pop()!
        .replace(/\.[^.]+$/, '');
    usePresentation(result.data, path, /\.pptx$/i.test(path));
    tell(
      /\.pptx$/i.test(path)
        ? '已导入 PPTX，保存时生成 VTPPT。复杂母版、图表和动画可能简化。'
        : `已打开 ${path.split('/').pop()}`
    );
  } catch (error) {
    tell(error instanceof Error ? error.message : '无法打开文件');
  } finally {
    loading.value = false;
  }
}
async function importLocalFile(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 30 * 1024 * 1024) {
    tell('请选择 30 MB 以内的演示文稿');
    return;
  }
  guarded(async () => {
    loading.value = true;
    appRef.value?.focus();
    try {
      const isPptx = /\.pptx$/i.test(file.name);
      const result = isPptx
        ? await importPptx(await file.arrayBuffer())
        : { data: normalizePresentation(JSON.parse(await file.text())), simplified: false };
      result.data.title = file.name.replace(/\.[^.]+$/, '');
      usePresentation(result.data, '', true);
      tell(isPptx ? '已导入 PPTX。复杂母版、图表和动画可能简化。' : '已从电脑导入');
    } catch (error) {
      tell(error instanceof Error ? error.message : '文件格式无效');
    } finally {
      loading.value = false;
    }
  });
}
async function download(format: 'pptx' | 'vtppt') {
  finishEditing();
  const name = cleanName() + '.' + format;
  try {
    const blob =
      format === 'pptx'
        ? await exportPptx(JSON.parse(snapshot()))
        : new Blob([snapshot()], { type: 'application/json;charset=utf-8' });
    downloadPptFile(blob, name);
    tell(`已导出 ${format.toUpperCase()}`);
  } catch {
    tell('导出失败，请重试');
  }
}
function printSlides() {
  finishEditing();
  const popup = window.open('', '_blank');
  if (!popup) {
    tell('请允许弹出打印窗口');
    return;
  }
  const html = pres.slides
    .map((slide) => {
      const page = document.createElement('section');
      page.style.cssText = `width:${pres.width}px;height:${pres.height}px;position:relative;overflow:hidden;background:${slide.backgroundColor};page-break-after:always;`;
      slide.elements.forEach((el) => {
        const div = document.createElement('div');
        Object.assign(div.style, elementStyle(el));
        div.style.position = 'absolute';
        div.style.whiteSpace = 'pre-wrap';
        div.style.boxSizing = 'border-box';
        div.style.padding = '6px 8px';
        if (el.type === 'image') {
          div.style.padding = '0';
          const image = document.createElement('img');
          image.src = el.content;
          image.style.cssText = 'width:100%;height:100%;object-fit:fill';
          div.appendChild(image);
        } else div.textContent = el.content;
        page.appendChild(div);
      });
      return page.outerHTML;
    })
    .join('');
  popup.document.write(
    `<html><head><title>演示文稿</title><style>@page{size:${pres.width}px ${pres.height}px;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial}section:last-child{page-break-after:auto!important}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${html}</body></html>`
  );
  popup.document.close();
  const images = Array.from(popup.document.images);
  Promise.all(
    images.map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.onload = resolve;
            image.onerror = resolve;
          })
    )
  ).then(() => {
    popup.focus();
    popup.print();
  });
}

const presenting = ref(false),
  presentationIndex = ref(0),
  presenterNotes = ref(false),
  autoAdvance = ref(false),
  advanceSeconds = ref(5),
  viewport = ref({ width: window.innerWidth, height: window.innerHeight });
const presentationSlide = computed(() => pres.slides[presentationIndex.value] || pres.slides[0]);
const presentationScale = computed(() =>
  Math.min(
    viewport.value.width / pres.width,
    (viewport.value.height - (presenterNotes.value ? 100 : 0)) / pres.height
  )
);
const presentationTransition = computed(() =>
  presentationSlide.value.transition === 'fade'
    ? 'slide-fade'
    : presentationSlide.value.transition === 'push'
      ? 'slide-push'
      : ''
);
let advanceTimer: ReturnType<typeof setInterval> | undefined;
let ownedFullscreen = false;
let presentationSession = 0;
async function startPresentation(index: number) {
  const session = ++presentationSession;
  clearInterval(advanceTimer);
  finishEditing();
  presentationIndex.value = index;
  presenting.value = true;
  await nextTick();
  const overlay = presRef.value;
  if (!overlay || session !== presentationSession || !presenting.value) return;
  overlay.focus();
  try {
    if (!document.fullscreenElement && overlay.requestFullscreen) {
      await overlay.requestFullscreen();
      if (session !== presentationSession || !presenting.value) {
        if (document.fullscreenElement === overlay) void document.exitFullscreen().catch(() => {});
        return;
      }
      ownedFullscreen = true;
    }
  } catch {
    /* The in-window presentation remains available. */
  }
  if (session !== presentationSession || !presenting.value) return;
  updateViewport();
  if (autoAdvance.value)
    advanceTimer = setInterval(nextSlide, Math.max(2, Math.min(120, advanceSeconds.value || 5)) * 1000);
}
function nextSlide() {
  if (presentationIndex.value < pres.slides.length - 1) presentationIndex.value++;
  else stopPresentation();
}
function stopPresentation() {
  presentationSession++;
  const overlay = presRef.value;
  presenting.value = false;
  clearInterval(advanceTimer);
  if (ownedFullscreen && document.fullscreenElement === overlay)
    void document.exitFullscreen().catch(() => {});
  ownedFullscreen = false;
  nextTick(() => appRef.value?.focus());
}
function updateViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
}
function onFullscreenChange() {
  if (ownedFullscreen && !document.fullscreenElement) stopPresentation();
  updateViewport();
}
function onPresentationKey(event: KeyboardEvent) {
  event.preventDefault();
  if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(event.key)) nextSlide();
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key))
    presentationIndex.value = Math.max(0, presentationIndex.value - 1);
  else if (event.key === 'Home') presentationIndex.value = 0;
  else if (event.key === 'End') presentationIndex.value = pres.slides.length - 1;
  else if (event.key === 'Escape') stopPresentation();
}
function onKeyDown(event: KeyboardEvent) {
  if (presenting.value) return;
  if (loading.value) {
    event.preventDefault();
    return;
  }
  if (fileDialog.value || confirmAction.value) {
    if (event.key === 'Escape') {
      event.preventDefault();
      fileDialog.value = null;
      confirmAction.value = null;
    }
    return;
  }
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (mod && key === 's') {
    event.preventDefault();
    event.shiftKey ? showSaveAs() : void saveFile();
    return;
  }
  if (event.key === 'F5') {
    event.preventDefault();
    void startPresentation(event.shiftKey ? curIdx.value : 0);
    return;
  }
  const target = event.target as HTMLElement;
  const input = ['TEXTAREA', 'INPUT', 'SELECT'].includes(target.tagName) || target.isContentEditable;
  if (input) return;
  if (mod && key === 'z') {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if (mod && key === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  if (mod && key === 'c' && selectedEl.value) {
    event.preventDefault();
    copyElement(false);
  }
  if (mod && key === 'x' && selectedEl.value) {
    event.preventDefault();
    copyElement(true);
  }
  if (mod && key === 'v' && clipboardEl.value) {
    event.preventDefault();
    pasteElement();
  }
  if (mod && key === 'd') {
    event.preventDefault();
    selectedEl.value ? duplicateElement() : duplicateSlide();
  }
  if (mod && key === 'm') {
    event.preventDefault();
    addSlide();
  }
  if (mod && ['b', 'i', 'u'].includes(key) && selectedText.value) {
    event.preventDefault();
    const property = key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline';
    format(property, !selectedEl.value?.[property]);
  }
  if (['Delete', 'Backspace'].includes(event.key) && selectedEl.value) {
    event.preventDefault();
    deleteElement();
  }
  if (event.key === 'Escape') deselect();
  if (selectedEl.value && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const amount = event.shiftKey ? 10 : 1;
    const el = selectedEl.value;
    if (event.key === 'ArrowLeft') format('x', el.x - amount);
    if (event.key === 'ArrowRight') format('x', el.x + amount);
    if (event.key === 'ArrowUp') format('y', el.y - amount);
    if (event.key === 'ArrowDown') format('y', el.y + amount);
  }
}

const draft = ref<Presentation | null>(null);
const draftKey = `vtron-ppt-draft:${win?.config?.path || 'new'}`;
let draftTimer: ReturnType<typeof setTimeout> | undefined;
function saveDraft() {
  if (!dirty.value) return;
  try {
    localStorage.setItem(draftKey, snapshot());
  } catch {
    /* Large embedded images may exceed local draft storage. */
  }
}
function discardDraft() {
  draft.value = null;
  try {
    localStorage.removeItem(draftKey);
  } catch {
    /* Storage may be unavailable. */
  }
}
function restoreDraft() {
  const previous = draft.value;
  if (!previous) return;
  guarded(() => {
    usePresentation(previous, '', true);
    draft.value = null;
    tell('已恢复未保存的演示文稿');
  });
}
watch(
  pres,
  () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 400);
  },
  { deep: true }
);
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    saveDraft();
    event.preventDefault();
    event.returnValue = '';
  }
}
let resizeObserver: ResizeObserver | null = null;
onMounted(async () => {
  appRef.value?.focus();
  if (win?.config?.path) await loadFile(win.config.path);
  try {
    const stored = localStorage.getItem(draftKey);
    if (stored) draft.value = normalizePresentation(JSON.parse(stored));
  } catch {
    /* Ignore invalid old drafts. */
  }
  resizeObserver = new ResizeObserver(() => {
    const width = appRef.value?.clientWidth || 1000;
    thumbWidth.value = width <= 580 ? 76 : width <= 850 ? 112 : 128;
    if (fitMode) fitCanvas();
  });
  if (appRef.value) resizeObserver.observe(appRef.value);
  if (editorAreaRef.value) resizeObserver.observe(editorAreaRef.value);
  fitCanvas();
  window.addEventListener('resize', updateViewport);
  window.addEventListener('beforeunload', beforeUnload);
  document.addEventListener('fullscreenchange', onFullscreenChange);
});
watch(editorAreaRef, (area) => {
  resizeObserver?.disconnect();
  if (area) resizeObserver?.observe(area);
  if (appRef.value) resizeObserver?.observe(appRef.value);
});
onUnmounted(() => {
  presentationSession++;
  saveDraft();
  cleanupPointer?.();
  clearTimeout(draftTimer);
  clearInterval(advanceTimer);
  resizeObserver?.disconnect();
  window.removeEventListener('resize', updateViewport);
  window.removeEventListener('beforeunload', beforeUnload);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  if (ownedFullscreen && document.fullscreenElement === presRef.value)
    void document.exitFullscreen().catch(() => {});
});
</script>

<style scoped>
.ppt-app {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f3f2f1;
  color: #242424;
  font:
    12px 'Segoe UI',
    'Microsoft YaHei',
    Arial,
    sans-serif;
  overflow: hidden;
  outline: none;
  position: relative;
  min-width: 0;
  --ppt-accent: #b7472a;
  --ppt-light: #fdf1ec;
}
.ppt-app :deep(*) {
  box-sizing: border-box;
}
.ppt-app button,
.ppt-app input,
.ppt-app select,
.ppt-app textarea {
  font: inherit;
  color: inherit;
}
.ppt-app button {
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
}
.ppt-app button:hover:not(:disabled) {
  background: #e6e4e2;
}
.ppt-app button:active:not(:disabled) {
  background: #d9d5d2;
}
.ppt-app button:disabled {
  opacity: 0.4;
  cursor: default;
}
.ppt-app button:focus-visible,
.ppt-app input:focus-visible,
.ppt-app select:focus-visible,
.ppt-app textarea:focus-visible {
  outline: 2px solid var(--ppt-accent);
  outline-offset: 1px;
}
.ppt-app :deep(svg) {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  vertical-align: middle;
}
.ppt-titlebar {
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 0 12px;
  background: #b7472a;
  color: #fff;
}
.app-mark {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  background: #fff;
  color: #b7472a;
  font-size: 21px;
  font-weight: 700;
  border-radius: 3px;
  margin-right: 8px;
}
.ppt-titlebar .quick-button {
  padding: 5px;
  color: #fff;
}
.ppt-titlebar button:hover:not(:disabled) {
  background: #ffffff20;
}
.document-name {
  width: 190px;
  max-width: 40%;
  margin-left: 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 5px 7px;
  color: #fff !important;
  font-size: 13px !important;
}
.document-name:hover,
.document-name:focus {
  border-color: #ffffff60;
  background: #ffffff12;
}
.save-state {
  font-size: 11px;
  opacity: 0.85;
  white-space: nowrap;
}
.title-play {
  margin-left: auto;
  display: flex;
  gap: 7px;
  align-items: center;
  color: #fff !important;
  padding: 5px 9px;
}
.ribbon-tabs {
  display: flex;
  flex-shrink: 0;
  height: 34px;
  background: #faf9f8;
  border-bottom: 1px solid #e4e2e0;
  padding: 0 9px;
  gap: 8px;
  overflow-x: auto;
}
.ribbon-tabs button {
  height: 34px;
  padding: 0 14px;
  border-radius: 0;
  position: relative;
  white-space: nowrap;
}
.ribbon-tabs button.active {
  font-weight: 600;
  color: #a43c23;
}
.ribbon-tabs button.active:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 13px;
  right: 13px;
  height: 3px;
  background: #b7472a;
  border-radius: 2px;
}
.ribbon {
  height: 106px;
  min-height: 106px;
  display: flex;
  gap: 0;
  padding: 7px 6px 4px;
  background: #faf9f8;
  border-bottom: 1px solid #d4d1ce;
  box-shadow: 0 1px 3px #00000005;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}
.ribbon-group {
  position: relative;
  min-width: max-content;
  padding: 0 11px 17px;
  border-right: 1px solid #dfdcda;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.ribbon-group:last-child {
  border-right: 0;
}
.ribbon-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
}
.ribbon :deep(.ribbon-tool) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  min-height: 59px;
  padding: 6px 8px;
  white-space: nowrap;
  font-size: 12px;
}
.ribbon :deep(.ribbon-tool svg) {
  width: 25px;
  height: 25px;
  color: #5b5b5b;
}
.ribbon-group :deep(.ribbon-tool.chosen),
.ppt-app button.chosen {
  background: #f4dfd6;
  border-color: #e9c7b8;
}
.group-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: #77716b;
  pointer-events: none;
}
.small-tools {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.small-tools button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 5px;
  text-align: left;
}
.small-tools button svg {
  width: 14px;
  height: 14px;
}
.small-tools label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.ribbon select {
  height: 25px;
  border: 1px solid #d2ceca;
  border-radius: 2px;
  background: #fff;
  padding: 2px 4px;
}
.font-group select:first-child {
  width: 132px;
}
.font-group select:last-child {
  width: 52px;
}
.format-button {
  height: 27px;
  min-width: 28px;
  padding: 3px 5px;
}
.color-tool {
  position: relative;
  width: 28px;
  height: 27px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: #b7472a;
  text-decoration-thickness: 3px;
  cursor: pointer;
}
.color-tool input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  white-space: nowrap;
}
.setting-label input[type='number'] {
  width: 48px;
  border: 1px solid #c8c4c0;
  border-radius: 3px;
  padding: 3px;
}
.setting-label input[type='color'] {
  width: 32px;
  height: 25px;
  padding: 2px;
  border: 1px solid #d2ceca;
  background: #fff;
}
.setting-label input[type='range'] {
  width: 110px;
  accent-color: var(--ppt-accent);
}
.shape-picker button {
  height: 59px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 4px 11px;
}
.shape-sample {
  display: block;
  width: 30px;
  height: 23px;
  background: #e7ac96;
  border: 1.5px solid #b7472a;
}
.shape-sample.roundRect {
  border-radius: 7px;
}
.shape-sample.ellipse {
  border-radius: 50%;
}
.shape-sample.triangle {
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}
.shape-sample.line {
  height: 2px;
  margin: 11px 0;
  background: #b7472a;
  border: 0;
}
.themes button {
  width: 82px;
  height: 62px;
  border: 1px solid #ddd5cf;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 6px 8px;
  gap: 3px;
}
.themes strong {
  font-size: 22px;
}
.themes span {
  font-size: 10px;
}
.themes button:hover {
  outline: 2px solid #b7472a;
  outline-offset: 1px;
}
.transition-options button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  height: 64px;
}
.transition-sample {
  width: 50px;
  height: 29px;
  display: block;
  border: 1px solid #b3b3b3;
  background: #fff;
}
.transition-sample.fade {
  background: linear-gradient(90deg, #fff, #e4aa91);
}
.transition-sample.push {
  background: linear-gradient(90deg, #f6e2d9 48%, #b7472a 49%, #b7472a 51%, #fff 52%);
}
.main-area {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}
.slide-list {
  width: 174px;
  flex-shrink: 0;
  background: #f8f7f6;
  border-right: 1px solid #d5d1ce;
  padding: 14px 10px 6px 2px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.thumb-wrap {
  display: flex;
  gap: 5px;
  align-items: flex-start;
}
.thumb-number {
  width: 22px;
  flex-shrink: 0;
  text-align: center;
  padding-top: 6px;
  font-size: 11px;
  color: #6a6764;
}
.thumb-button {
  padding: 0 !important;
  border: 2px solid transparent !important;
  border-radius: 2px !important;
  background: #fff !important;
  display: block;
}
.thumb-wrap.active .thumb-button {
  border-color: #b7472a !important;
}
.thumb-wrap.active .thumb-number {
  color: #b7472a;
  font-weight: 700;
}
.thumb-frame {
  position: relative;
  width: 128px;
  overflow: hidden;
  box-shadow: 0 0 0 1px #0000001b;
}
.slide-surface {
  position: relative;
  transform-origin: top left;
  overflow: hidden;
  color: #20242c;
  flex-shrink: 0;
}
.thumbnail-surface {
  pointer-events: none;
}
.slide-element {
  position: absolute;
  white-space: pre-wrap;
  box-sizing: border-box;
  line-height: 1.25;
  overflow: hidden;
  word-break: break-word;
}
.slide-element img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
  pointer-events: none;
}
.element-text {
  width: 100%;
  min-height: 100%;
  padding: 6px 8px;
}
.add-slide-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 30px;
  margin-left: 26px;
  color: #80503d !important;
}
.add-slide-button svg {
  width: 13px !important;
  height: 13px !important;
}
.slide-order-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-left: 24px;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  background: #f8f7f6;
  padding: 6px 0;
}
.slide-order-actions button {
  width: 26px;
  height: 26px;
}
.slide-order-actions svg {
  width: 14px !important;
  height: 14px !important;
}
.workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.editor-area {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 28px 32px;
  display: flex;
  background: #e9e8e7;
}
.canvas-box {
  position: relative;
  flex-shrink: 0;
  margin: auto;
  box-shadow: 0 2px 7px #00000020;
  outline: 1px solid #d0ceca;
}
.slide-canvas {
  user-select: none;
  touch-action: none;
}
.slide-canvas.with-grid {
  background-image: radial-gradient(#77777755 0.8px, transparent 0.8px);
  background-size: 10px 10px;
}
.editable-element {
  cursor: move;
  overflow: visible;
}
.editable-element > .element-text {
  overflow: hidden;
  max-height: 100%;
}
.editable-element.selected {
  outline: 1.5px solid #bd552f;
  overflow: visible;
}
.editable-element.is-editing {
  cursor: text;
}
.element-editor {
  display: block;
  height: 100%;
  width: 100%;
  resize: none;
  border: 0;
  outline: 0 !important;
  padding: 6px 8px;
  background: transparent;
  color: inherit;
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: inherit;
  font-style: inherit;
  text-align: inherit;
  text-decoration: inherit;
  line-height: inherit;
  overflow: hidden;
  user-select: text;
  box-sizing: border-box;
}
.resize-handle {
  position: absolute;
  width: 9px;
  height: 9px;
  border: 1.5px solid #bd552f;
  background: #fff;
  z-index: 4;
  border-radius: 50%;
  touch-action: none;
}
.resize-handle.nw {
  left: -5px;
  top: -5px;
  cursor: nwse-resize;
}
.resize-handle.ne {
  right: -5px;
  top: -5px;
  cursor: nesw-resize;
}
.resize-handle.sw {
  left: -5px;
  bottom: -5px;
  cursor: nesw-resize;
}
.resize-handle.se {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}
.notes-panel {
  height: 82px;
  min-height: 60px;
  border-top: 1px solid #d7d4d0;
  background: #fff;
  display: flex;
  gap: 15px;
  padding: 10px 18px;
  flex-shrink: 0;
}
.notes-panel label {
  font-weight: 600;
  color: #68635e;
  padding-top: 4px;
  font-size: 11px;
}
.notes-panel textarea {
  border: 0;
  outline: none;
  flex: 1;
  min-width: 0;
  resize: none;
  line-height: 1.7;
  padding: 3px 0;
  background: transparent;
}
.notes-panel textarea::placeholder {
  color: #9d9892;
}
.format-pane {
  width: 185px;
  flex-shrink: 0;
  border-left: 1px solid #d5d1ce;
  background: #faf9f8;
  overflow: auto;
  padding: 12px;
}
.pane-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 13px;
}
.pane-title strong {
  font-size: 13px;
}
.pane-title button {
  font-size: 18px;
  width: 23px;
  height: 23px;
  line-height: 1;
}
.property-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 8px;
}
.property-fields label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #605b57;
  font-size: 11px;
}
.property-fields input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d0ccc7;
  border-radius: 3px;
  padding: 4px;
  background: #fff;
}
.pane-property {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 13px;
  justify-content: space-between;
  font-size: 11px;
}
.pane-property input[type='number'] {
  width: 66px;
  padding: 4px;
  border: 1px solid #d0ccc7;
  border-radius: 3px;
  background: #fff;
}
.pane-property input[type='color'] {
  width: 34px;
  height: 25px;
  border: 1px solid #d0ccc7;
  padding: 2px;
  background: #fff;
}
.pane-button {
  display: block;
  margin-left: auto;
  font-size: 11px !important;
  padding: 4px 0 !important;
  color: #8b452e !important;
}
.pane-divider {
  height: 1px;
  background: #dfdbd6;
  margin: 15px 0;
}
.pane-section {
  font-size: 11px;
  color: #605b57;
}
.pane-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-top: 10px;
}
.pane-buttons button {
  padding: 6px 3px;
  border: 1px solid #dedad5;
  font-size: 11px;
  background: #fff;
}
.slide-sorter {
  flex: 1;
  overflow: auto;
  padding: 28px;
  display: flex;
  align-content: flex-start;
  flex-wrap: wrap;
  gap: 24px;
  background: #e9e8e7;
}
.sorter-item {
  width: 244px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 11px;
  color: #5d5550;
}
.sorter-item.active .thumb-button {
  border-color: #b7472a !important;
}
.sorter-item span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.status-bar {
  height: 29px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 5px;
  padding: 0 9px;
  border-top: 1px solid #d1ccc7;
  background: #faf9f8;
  color: #625c56;
  font-size: 11px;
  white-space: nowrap;
}
.status-bar > span:first-child {
  padding-right: 10px;
}
.status-message {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  color: #7c634f;
}
.status-bar button {
  padding: 3px 5px;
  height: 24px;
  font-size: 11px;
}
.status-bar svg {
  width: 14px !important;
  height: 14px !important;
}
.status-bar input[type='range'] {
  width: 85px;
  min-width: 40px;
  accent-color: #b7472a;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0006;
  z-index: 500;
  padding: 20px;
}
.file-dialog {
  width: 450px;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 22px;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 12px 50px #0003;
}
.dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 19px;
}
.file-dialog h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.dialog-heading > button {
  font-size: 23px;
  width: 28px;
  height: 28px;
}
.file-dialog > label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #5b5550;
}
.file-dialog input {
  width: 100%;
  padding: 8px;
  border: 1px solid #b9b1a9;
  border-radius: 3px;
  font-size: 12px;
  user-select: text;
}
.file-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
.file-dialog footer button {
  padding: 7px 16px;
  border: 1px solid #d8d1ca;
  background: #f9f7f5;
}
.ppt-app .primary-button {
  background: #b7472a;
  color: #fff;
  border-color: #b7472a;
}
.ppt-app .primary-button:hover {
  background: #9c3922;
}
.recent-files {
  display: flex;
  flex-direction: column;
  max-height: 180px;
  overflow: auto;
  margin-top: 12px;
  gap: 3px;
}
.recent-files button {
  padding: 8px;
  text-align: left;
  display: flex;
  gap: 8px;
}
.recent-files svg {
  width: 16px !important;
  height: 16px !important;
  color: #b7472a;
}
.recent-files > span {
  font-size: 11px;
  color: #888;
  padding: 7px;
}
.dialog-error {
  color: #bb1b1b;
  font-size: 12px;
  margin: 13px 0 0;
}
.confirm-dialog p {
  margin: 17px 0;
  color: #5e5852;
}
.draft-bar {
  position: absolute;
  left: 50%;
  top: 192px;
  transform: translateX(-50%);
  max-width: 90%;
  padding: 9px 13px;
  background: #fff4d2;
  border: 1px solid #d6bc72;
  border-radius: 4px;
  box-shadow: 0 2px 8px #0001;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
  white-space: nowrap;
}
.draft-bar button {
  padding: 3px 7px;
  border-color: #d6bc72;
}
.presentation-overlay {
  position: fixed;
  inset: 0;
  background: #111;
  z-index: 100000;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.presentation-stage {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.presentation-slide {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  translate: -50% -50%;
}
.presentation-controls {
  position: absolute;
  left: 20px;
  bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #222b;
  border-radius: 5px;
  padding: 5px 8px;
  font-size: 12px;
  opacity: 0.15;
  transition: opacity 0.15s;
}
.presentation-controls:hover,
.presentation-controls:focus-within {
  opacity: 1;
}
.presentation-controls button {
  color: #fff;
  padding: 5px 8px;
}
.presentation-controls button:hover:not(:disabled) {
  background: #ffffff20;
}
.presentation-notes {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  max-width: 70%;
  max-height: 85px;
  overflow: auto;
  white-space: pre-wrap;
  background: #111c;
  color: #fff;
  border-radius: 5px;
  padding: 12px;
  font-size: 14px;
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.25s;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}
.slide-push-enter-active,
.slide-push-leave-active {
  transition:
    opacity 0.25s,
    margin-left 0.25s;
}
.slide-push-enter-from {
  margin-left: 80px;
  opacity: 0;
}
.slide-push-leave-to {
  margin-left: -80px;
  opacity: 0;
}
@media (max-width: 850px) {
  .format-pane {
    width: 155px;
    padding: 10px;
  }
  .slide-list {
    width: 154px;
    padding-right: 4px;
  }
  .thumb-frame {
    width: 112px;
  }
  .thumb-button {
    max-width: 116px;
  }
  .sorter-item .thumb-button {
    max-width: none;
  }
  .thumb-number {
    width: 19px;
  }
  .ribbon-group {
    padding-left: 8px;
    padding-right: 8px;
  }
  .document-name {
    width: 160px;
  }
  .save-state {
    display: none;
  }
  .ribbon-tabs {
    gap: 1px;
  }
  .ribbon-tabs button {
    padding: 0 12px;
  }
  .status-message {
    display: none;
  }
  .status-bar > span:first-child {
    margin-right: auto;
  }
}
@media (max-width: 580px) {
  .ppt-titlebar {
    padding: 0 7px;
    gap: 1px;
    height: 37px;
  }
  .app-mark {
    width: 21px;
    height: 21px;
    font-size: 18px;
    margin-right: 4px;
  }
  .document-name {
    margin-left: 3px;
    width: 135px;
    max-width: 42%;
  }
  .title-play {
    font-size: 11px;
    padding: 4px !important;
  }
  .ribbon-tabs {
    height: 31px;
    padding-left: 4px;
  }
  .ribbon-tabs button {
    height: 31px;
    padding: 0 10px;
  }
  .ribbon {
    height: 95px;
    min-height: 95px;
  }
  .ribbon-group {
    padding-bottom: 14px;
  }
  .ribbon :deep(.ribbon-tool) {
    min-height: 52px;
    padding: 4px 7px;
  }
  .slide-list {
    width: 103px;
    padding: 10px 3px 5px 0;
    gap: 9px;
  }
  .thumb-number {
    font-size: 9px;
    width: 15px;
  }
  .thumb-frame {
    width: 77px;
    max-height: 58px;
  }
  .thumb-button {
    max-width: 81px;
  }
  .add-slide-button {
    font-size: 10px !important;
    margin-left: 12px;
    white-space: nowrap;
    gap: 1px;
  }
  .add-slide-button svg {
    display: none;
  }
  .slide-order-actions {
    margin-left: 9px;
    gap: 0;
  }
  .slide-order-actions button {
    width: 22px;
    padding: 2px;
  }
  .editor-area {
    padding: 18px 16px;
  }
  .format-pane {
    display: none;
  }
  .notes-panel {
    height: 67px;
    padding: 6px 9px;
    gap: 8px;
  }
  .notes-panel label {
    font-size: 10px;
  }
  .notes-panel textarea {
    font-size: 11px;
  }
  .status-bar {
    padding: 0 5px;
    gap: 2px;
    font-size: 10px;
  }
  .status-bar > button:first-of-type {
    display: none;
  }
  .status-bar input[type='range'] {
    width: 50px;
  }
  .status-bar button {
    padding: 2px 3px;
  }
  .draft-bar {
    top: 172px;
    font-size: 10px;
    gap: 5px;
    padding: 7px;
  }
  .slide-sorter {
    padding: 18px;
    justify-content: center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ppt-app * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
