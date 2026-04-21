import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const DEFAULT_LAYER_MIN = 0;
const DEFAULT_LAYER_MAX = 27;
const DEFAULT_LAYER_COUNT = DEFAULT_LAYER_MAX - DEFAULT_LAYER_MIN + 1;
const HIDDEN_DIMS = 12;
const PCA_COMPONENTS = 3;
const SVD_COMPONENTS = 6;
const CATEGORY_ORDER = ["math", "language", "code", "logic"];
const CATEGORY_X = {
  math: 1.0,
  language: 2.35,
  code: 3.7,
  logic: 5.05,
};
const HOVER_PIXEL_RADIUS = 18;
const GUIDE_MIN_X = 0.3;
const GUIDE_MAX_X = 5.75;
const VIEW_TARGET = new THREE.Vector3(3.0, 0.15, 0);
const DATASET_FILE_BY_PROJECTION = {
  pca: "./hidden_states.json",
  umap: "./hidden_states_umap.json",
};
let dataLayerMin = DEFAULT_LAYER_MIN;
let dataLayerMax = DEFAULT_LAYER_MAX;

const CATEGORY_CONFIG = {
  math: { color: "#4d9cff" },
  language: { color: "#59d47f" },
  code: { color: "#ff9a3c" },
  logic: { color: "#e86dff" },
};

const TRANSLATIONS = {
  tr: {
    headerSubtitle: "Panel toggles",
    projectionPca: "PCA",
    projectionUmap: "UMAP",
    tabSpace: "Uzay",
    tabHeatmap: "Heatmap",
    panelAbout: "Hakkinda",
    panelControls: "Kontroller",
    panelLegend: "Lejant",
    panelAnalysis: "Analiz",
    panelSimilarity: "Benzerlik",
    panelHover: "Detay",
    heroLede: "Varsayilan gorunum true latent modunda secili katmani PCA duzleminde aciyor. Atlas gorunumu istersen geri donebilir, katmanlar arasi izleri ve yakinlik cizgilerini ayni sahnede inceleyebilirsin.",
    datasetLoading: "Veri yukleniyor",
    layerRange: "Katman {min}-{max}",
    tokenCount: "{count} token",
    viewLabel: "Gorunum",
    viewLatent: "True latent",
    viewAtlas: "Atlas",
    cameraLabel: "Kamera",
    cameraFocus: "Odakli",
    cameraFree: "Free camera",
    layerSliderLabel: "Odak Katman",
    layerVisibilityLabel: "Gorunur Katmanlar",
    layerVisibilityCurrent: "Secili",
    layerVisibilityAll: "Hepsi",
    layerVisibilityCustom: "Ozel",
    layerVisibilityApply: "Uygula",
    layerVisibilityPlaceholder: "0, 4, 8-12",
    layerVisibilitySummaryCurrent: "Secili",
    layerVisibilitySummaryAll: "Tum katmanlar",
    layerVisibilitySummaryCustom: "Ozel",
    thresholdSliderLabel: "Ball Tree Esik Mesafesi",
    layerFocusBoxLabel: "Katman Odagi",
    connectionCountLabel: "Baglanti sayisi",
    pcaVarianceLabel: "PCA aciklama",
    navigationLabel: "Gezinti",
    navigationFocus: "Yatay rotate / Zoom",
    navigationFree: "Free rotate / Pan / Zoom",
    hoverLabel: "Hover",
    hoverDetailLabel: "Token ayrintisi",
    legendTitle: "Renk Haritasi",
    legendAtlas: "Atlas / kategori kolonlari",
    legendLatentFallback: "True latent / layer-fit PCA",
    legendMathDesc: "Mavi nokta bulutu",
    legendLanguageDesc: "Yesil nokta bulutu",
    legendCodeDesc: "Turuncu nokta bulutu",
    legendLogicDesc: "Mor nokta bulutu",
    hoverEmpty: "Bir tokenin ustune gelince token metni, katman ve aktif SVD bilesenleri burada gorunecek.",
    separationEmpty: "Katman bazli ayrisma skoru burada gorunecek.",
    similarityEmpty: "Katman bazli kategori benzerlik isi haritasi burada gorunecek.",
    layerWord: "Katman",
    positionWord: "Pozisyon",
    activationStrength: "Aktivasyon siddeti",
    pcaPosition: "PCA konumu",
    umapPosition: "UMAP konumu",
    promptWord: "Prompt",
    activeSvd: "Aktif SVD bilesenleri",
    qkSummary: "QK skor ozeti",
    topKeys: "Top anahtarlar",
    separationTitle: "Katman Ayrisma Skoru",
    separationDescription: "Kategoriler arasi ortalama mesafe. En yuksek skor router icin en net ayrisan katman.",
    similarityTitle: "Kategori Cosine Similarity",
    similarityDescription: "Kosegen kategori ici, diger hucreler kategoriler arasi ortalama cosine similarity degerlerini gosterir.",
    heatmapLayerLabel: "Heatmap katmani",
    similarityLow: "Dusuk",
    similarityHigh: "Yuksek",
    similarityWithin: "Kategori ici ortalama",
    similarityBetween: "Kategoriler arasi ortalama",
    similarityWithinShort: "ici",
    similarityCrossShort: "arasi",
    similarityLayerBadge: "Heatmap L{layer}",
    similarityUnavailable: "Bu export dosyasinda heatmap verisi yok.",
    bestLayerShort: "Best L{layer}",
    spaceFrame: "Uzay cercevesi",
    activeRegion: "Aktif bolge",
    selectedLayer: "Secili katman",
    optimalLayer: "Optimal katman",
    regionCount: "{count} soru bolgesi",
    scoreWord: "skor",
    latentLegendAdaptive: "True latent / layer-fit PCA-{a} x PCA-{b}",
    category_math: "Matematik",
    category_language: "Dil",
    category_code: "Kod",
    category_logic: "Mantik",
    shape_empty: "bos alan",
    shape_wide_rect: "genis yatay dikdortgen",
    shape_round_rect: "yuvarlatilmis dikdortgen",
    shape_roundish: "yuvarlaga yakin alan",
  },
  en: {
    headerSubtitle: "Panel toggles",
    projectionPca: "PCA",
    projectionUmap: "UMAP",
    tabSpace: "Space",
    tabHeatmap: "Heatmap",
    panelAbout: "About",
    panelControls: "Controls",
    panelLegend: "Legend",
    panelAnalysis: "Analysis",
    panelSimilarity: "Similarity",
    panelHover: "Hover",
    heroLede: "The default view opens the selected layer in true latent mode on the PCA plane. You can switch back to atlas mode and inspect cross-layer traces and neighborhood links in the same scene.",
    datasetLoading: "Loading data",
    layerRange: "Layers {min}-{max}",
    tokenCount: "{count} tokens",
    viewLabel: "View",
    viewLatent: "True latent",
    viewAtlas: "Atlas",
    cameraLabel: "Camera",
    cameraFocus: "Focused",
    cameraFree: "Free camera",
    layerSliderLabel: "Focus Layer",
    layerVisibilityLabel: "Visible Layers",
    layerVisibilityCurrent: "Current",
    layerVisibilityAll: "All",
    layerVisibilityCustom: "Custom",
    layerVisibilityApply: "Apply",
    layerVisibilityPlaceholder: "0, 4, 8-12",
    layerVisibilitySummaryCurrent: "Current",
    layerVisibilitySummaryAll: "All layers",
    layerVisibilitySummaryCustom: "Custom",
    thresholdSliderLabel: "Ball Tree Threshold",
    layerFocusBoxLabel: "Layer Focus",
    connectionCountLabel: "Connection count",
    pcaVarianceLabel: "PCA variance",
    navigationLabel: "Navigation",
    navigationFocus: "Horizontal rotate / Zoom",
    navigationFree: "Free rotate / Pan / Zoom",
    hoverLabel: "Hover",
    hoverDetailLabel: "Token details",
    legendTitle: "Color Map",
    legendAtlas: "Atlas / category columns",
    legendLatentFallback: "True latent / layer-fit PCA",
    legendMathDesc: "Blue point cloud",
    legendLanguageDesc: "Green point cloud",
    legendCodeDesc: "Orange point cloud",
    legendLogicDesc: "Pink point cloud",
    hoverEmpty: "When you hover a token, its text, layer, and active SVD components will appear here.",
    separationEmpty: "Layer-wise separation score will appear here.",
    similarityEmpty: "Layer-wise category similarity heatmap will appear here.",
    layerWord: "Layer",
    positionWord: "Position",
    activationStrength: "Activation strength",
    pcaPosition: "PCA position",
    umapPosition: "UMAP position",
    promptWord: "Prompt",
    activeSvd: "Active SVD components",
    qkSummary: "QK score summary",
    topKeys: "Top keys",
    separationTitle: "Layer Separation Score",
    separationDescription: "Average distance between categories. The highest score marks the clearest layer for routing.",
    similarityTitle: "Category Cosine Similarity",
    similarityDescription: "The diagonal shows within-category similarity, while off-diagonal cells show cross-category average cosine similarity.",
    heatmapLayerLabel: "Heatmap layer",
    similarityLow: "Low",
    similarityHigh: "High",
    similarityWithin: "Within-category average",
    similarityBetween: "Cross-category average",
    similarityWithinShort: "within",
    similarityCrossShort: "cross",
    similarityLayerBadge: "Heatmap L{layer}",
    similarityUnavailable: "This export does not include heatmap data.",
    bestLayerShort: "Best L{layer}",
    spaceFrame: "Space frame",
    activeRegion: "Active region",
    selectedLayer: "Selected layer",
    optimalLayer: "Optimal layer",
    regionCount: "{count} prompt regions",
    scoreWord: "score",
    latentLegendAdaptive: "True latent / layer-fit PCA-{a} x PCA-{b}",
    category_math: "Math",
    category_language: "Language",
    category_code: "Code",
    category_logic: "Logic",
    shape_empty: "empty field",
    shape_wide_rect: "wide horizontal rectangle",
    shape_round_rect: "rounded rectangle",
    shape_roundish: "near-circular field",
  },
};

const TOKEN_SETS = {
  math: [
    "sum", "pi", "theta", "alpha", "beta", "gamma", "delta", "integral", "matrix",
    "vector", "tensor", "proof", "lemma", "prime", "sqrt", "limit", "sigma",
  ],
  language: [
    "story", "syntax", "phrase", "dialogue", "metaphor", "grammar", "narrative", "poem",
    "accent", "context", "idiom", "tense", "voice", "semantics", "sentence", "morphology", "rhetoric",
  ],
  code: [
    "def", "class", "async", "await", "return", "lambda", "struct", "fn",
    "const", "let", "while", "if", "else", "import", "module", "stack",
  ],
};

const layerSlider = document.getElementById("layerSlider");
const thresholdSlider = document.getElementById("thresholdSlider");
const layerValue = document.getElementById("layerValue");
const thresholdValue = document.getElementById("thresholdValue");
const wAxisReadout = document.getElementById("wAxisReadout");
const varianceInfo = document.getElementById("varianceInfo");
const edgeCount = document.getElementById("edgeCount");
const hoverPanel = document.getElementById("hoverPanel");
const separationPanel = document.getElementById("separationPanel");
const similarityPanel = document.getElementById("similarityPanel");
const tooltip = document.getElementById("tooltip");
const wMarker = document.getElementById("wMarker");
const wTicks = [...document.querySelectorAll(".w-tick")];
const legendItems = [...document.querySelectorAll(".legend-item[data-category]")];
const modeButtons = [...document.querySelectorAll(".mode-button[data-view-mode]")];
const cameraModeButtons = [...document.querySelectorAll(".mode-button[data-camera-mode]")];
const headerButtons = [...document.querySelectorAll(".header-button[data-panel-target]")];
const langButtons = [...document.querySelectorAll(".header-button[data-lang]")];
const projectionSourceButtons = [...document.querySelectorAll(".header-button[data-projection-source]")];
const canvas = document.getElementById("scene");
const tokenCountChip = document.getElementById("tokenCountChip");
const layerRangeChip = document.getElementById("layerRangeChip");
const datasetChip = document.getElementById("datasetChip");
const modeReadout = document.getElementById("modeReadout");
const legendModeLabel = document.getElementById("legendModeLabel");
const cameraModeReadout = document.getElementById("cameraModeReadout");
const navigationReadout = document.getElementById("navigationReadout");
const heroPanel = document.getElementById("heroPanel");
const controlsPanel = document.getElementById("controlsPanel");
const legendPanel = document.getElementById("legendPanel");
const headerSubtitle = document.getElementById("headerSubtitle");
const projectionPcaButton = document.getElementById("projectionPcaButton");
const projectionUmapButton = document.getElementById("projectionUmapButton");
const projectionHeatmapButton = document.getElementById("projectionHeatmapButton");
const panelAboutButton = document.getElementById("panelAboutButton");
const panelControlsButton = document.getElementById("panelControlsButton");
const panelLegendButton = document.getElementById("panelLegendButton");
const panelAnalysisButton = document.getElementById("panelAnalysisButton");
const panelHoverButton = document.getElementById("panelHoverButton");
const heroLede = document.getElementById("heroLede");
const viewLabel = document.getElementById("viewLabel");
const viewLatentButton = document.getElementById("viewLatentButton");
const viewAtlasButton = document.getElementById("viewAtlasButton");
const cameraLabel = document.getElementById("cameraLabel");
const cameraFocusButton = document.getElementById("cameraFocusButton");
const cameraFreeButton = document.getElementById("cameraFreeButton");
const layerSliderLabel = document.getElementById("layerSliderLabel");
const layerVisibilityLabel = document.getElementById("layerVisibilityLabel");
const layerVisibilityReadout = document.getElementById("layerVisibilityReadout");
const visibleLayerButtons = [...document.querySelectorAll(".mode-button[data-layer-visibility]")];
const visibleLayerCurrentButton = document.getElementById("visibleLayerCurrentButton");
const visibleLayerAllButton = document.getElementById("visibleLayerAllButton");
const visibleLayerCustomButton = document.getElementById("visibleLayerCustomButton");
const layerSelectionInput = document.getElementById("layerSelectionInput");
const applyLayerSelectionButton = document.getElementById("applyLayerSelectionButton");
const thresholdSliderLabel = document.getElementById("thresholdSliderLabel");
const layerFocusBoxLabel = document.getElementById("layerFocusBoxLabel");
const connectionCountLabel = document.getElementById("connectionCountLabel");
const pcaVarianceLabel = document.getElementById("pcaVarianceLabel");
const navigationLabel = document.getElementById("navigationLabel");
const hoverLabel = document.getElementById("hoverLabel");
const hoverDetailLabel = document.getElementById("hoverDetailLabel");
const legendTitle = document.getElementById("legendTitle");
const legendMathLabel = document.getElementById("legendMathLabel");
const legendMathDesc = document.getElementById("legendMathDesc");
const legendLanguageLabel = document.getElementById("legendLanguageLabel");
const legendLanguageDesc = document.getElementById("legendLanguageDesc");
const legendCodeLabel = document.getElementById("legendCodeLabel");
const legendCodeDesc = document.getElementById("legendCodeDesc");
const legendLogicLabel = document.getElementById("legendLogicLabel");
const legendLogicDesc = document.getElementById("legendLogicDesc");
const hoverEmpty = document.getElementById("hoverEmpty");
const separationEmpty = document.getElementById("separationEmpty");
const similarityEmpty = document.getElementById("similarityEmpty");

let currentProjectionSource = localStorage.getItem("llm-space-projection-source") === "umap" ? "umap" : "pca";
const dataset = await loadDataset();
dataset.latentBoundsByLayer = computeLayerLatentBounds(dataset.tokens);
const layerMin = dataset.layerMin;
const layerMax = dataset.layerMax;
const activeCategories = new Set(dataset.tokens.map((token) => token.category));
let layerScores = computeLayerSeparationScores(dataset, activeCategories);
let bestLayerRow = pickBestLayerRow(layerScores, layerMin);
let selectedLayer = bestLayerRow.layer;
let hoveredPoint = null;
let viewMode = "latent";
let cameraMode = "focus";
let layerVisibilityMode = "current";
let currentLang = localStorage.getItem("llm-space-lang") === "en" ? "en" : "tr";
let currentAppMode = localStorage.getItem("llm-space-app-mode") === "heatmap" ? "heatmap" : "space";
const openPanels = new Set();
const allLayers = Array.from({ length: layerMax - layerMin + 1 }, (_, index) => layerMin + index);
let customVisibleLayers = [selectedLayer];
let visibleLayerList = [selectedLayer];
let visibleLayerSet = new Set(visibleLayerList);

dataset.pointInstances = buildPointInstances(dataset);
dataset.pointSizeRange = computePointSizeRange(dataset.pointInstances);
let spaceFrameProfile = computeSpaceFrame(dataset.pointInstances, activeCategories);

layerSlider.min = `${layerMin}`;
layerSlider.max = `${layerMax}`;
layerSlider.value = `${selectedLayer}`;
layerValue.textContent = `${selectedLayer}`;
thresholdValue.textContent = Number(thresholdSlider.value).toFixed(2);
wAxisReadout.textContent = `${t("layerWord")} ${selectedLayer}`;
varianceInfo.textContent = dataset.varianceText;
updateWMarker(selectedLayer);
updateWTicks();
syncVisibleLayers();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.01, 200);
camera.position.set(3.0, 4.5, 8.1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.enableZoom = true;
controls.zoomSpeed = 1.1;
controls.minDistance = 2.1;
controls.maxDistance = 16;
controls.target.copy(VIEW_TARGET);
controls.minPolarAngle = 1.02;
controls.maxPolarAngle = 1.02;
const desiredFocusTarget = VIEW_TARGET.clone();
let desiredFocusDistance = camera.position.distanceTo(controls.target);
let focusAnimation = 1;

scene.add(new THREE.AmbientLight(0xffffff, 1.45));

const rimLight = new THREE.DirectionalLight(0x9ac2ff, 0.86);
rimLight.position.set(6, 10, 9);
scene.add(rimLight);

const accentLight = new THREE.PointLight(0xffb15e, 14, 42, 2);
accentLight.position.set(-2, 10, 8);
scene.add(accentLight);

const horizontalGuides = createHorizontalGuides();
const categoryGuides = createCategoryGuides();
let categoryLabels = createCategoryLabels();
const layerLabels = createLayerLabels(layerMin, layerMax);
scene.add(horizontalGuides);
scene.add(categoryGuides);
scene.add(categoryLabels);
scene.add(layerLabels);

const pointsGeometry = new THREE.BufferGeometry();
const pointsMaterial = createPointMaterial();
const points = new THREE.Points(pointsGeometry, pointsMaterial);
points.renderOrder = 3;
scene.add(points);

const tokenTraceGeometry = new THREE.BufferGeometry();
const tokenTraceMaterial = new THREE.LineBasicMaterial({
  transparent: true,
  opacity: 0.14,
  vertexColors: true,
});
const tokenTraceLines = new THREE.LineSegments(tokenTraceGeometry, tokenTraceMaterial);
tokenTraceLines.renderOrder = 1;
scene.add(tokenTraceLines);

const ballLinesGeometry = new THREE.BufferGeometry();
const ballLinesMaterial = new THREE.LineBasicMaterial({
  transparent: true,
  opacity: 0.34,
  vertexColors: true,
});
const ballLines = new THREE.LineSegments(ballLinesGeometry, ballLinesMaterial);
ballLines.renderOrder = 2;
scene.add(ballLines);

const focusGuide = createGuideLine(0x7bd6ff, 0.3);
scene.add(focusGuide);

const bestLayerGuide = createGuideLine(0xe5c07b, 0.22);
bestLayerGuide.position.y = layerToY(bestLayerRow.layer);
scene.add(bestLayerGuide);

const layerSlicePrototype = createLayerSlicePrototype();
const layerSlicesGroup = new THREE.Group();
scene.add(layerSlicesGroup);

const activityHotspotGroup = new THREE.Group();
activityHotspotGroup.renderOrder = 2;
scene.add(activityHotspotGroup);

const heatmapSceneGroup = new THREE.Group();
heatmapSceneGroup.renderOrder = 5;
scene.add(heatmapSceneGroup);

const selectionRing = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createRingSprite(),
    color: "#f9f7ef",
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    depthTest: false,
  }),
);
selectionRing.visible = false;
selectionRing.scale.set(0.72, 0.72, 1);
selectionRing.renderOrder = 4;
scene.add(selectionRing);

const pointer = new THREE.Vector2(2, 2);
const projectedVector = new THREE.Vector3();

let visiblePointInstances = [];
applyStaticTranslations();
updateAppModeUi();
updateModeUi();
updateCameraModeUi();
updatePanelUi();
updateSceneGeometry();
updateFocusLayerVisuals();
renderSeparationPanel();
renderSimilarityPanel();
setHoverPanel(null);

window.addEventListener("resize", onResize);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerleave", clearHover);
layerSlider.addEventListener("input", onLayerChange);
visibleLayerButtons.forEach((button) => {
  button.addEventListener("click", () => setLayerVisibilityMode(button.dataset.layerVisibility));
});
applyLayerSelectionButton.addEventListener("click", applyCustomLayerSelection);
layerSelectionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyCustomLayerSelection();
  }
});
thresholdSlider.addEventListener("input", onThresholdChange);
legendItems.forEach((item) => {
  item.addEventListener("click", () => toggleCategory(item.dataset.category));
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCategory(item.dataset.category);
    }
  });
});
modeButtons.forEach((button) => {
  button.addEventListener("click", () => setViewMode(button.dataset.viewMode));
});
cameraModeButtons.forEach((button) => {
  button.addEventListener("click", () => setCameraMode(button.dataset.cameraMode));
});
langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});
projectionSourceButtons.forEach((button) => {
  button.addEventListener("click", () => setProjectionSource(button.dataset.projectionSource));
});
projectionHeatmapButton.addEventListener("click", () => setAppMode("heatmap"));
headerButtons.forEach((button) => {
  button.addEventListener("click", () => togglePanel(button.dataset.panelTarget));
});
separationPanel.addEventListener("click", onSeparationPanelClick);
similarityPanel.addEventListener("input", onSimilarityPanelInput);

requestAnimationFrame(animate);

function animate() {
  requestAnimationFrame(animate);
  if (cameraMode === "focus" && focusAnimation > 0.001) {
    updateCameraFocus();
  }
  controls.update();
  updateHover();
  renderer.render(scene, camera);
}

function applySelectedLayer(nextLayer) {
  selectedLayer = Number(nextLayer);
  if (layerVisibilityMode === "current") {
    visibleLayerList = [selectedLayer];
    visibleLayerSet = new Set(visibleLayerList);
  } else if (layerVisibilityMode === "custom" && !customVisibleLayers.includes(selectedLayer)) {
    customVisibleLayers = normalizeLayerList([...customVisibleLayers, selectedLayer]);
  }
  syncVisibleLayers();
  layerSlider.value = `${selectedLayer}`;
  layerValue.textContent = `${selectedLayer}`;
  wAxisReadout.textContent = `${t("layerWord")} ${selectedLayer}`;
  updateWMarker(selectedLayer);
  updateModeUi();
  updateSceneGeometry();
  updateFocusLayerVisuals();
  renderSeparationPanel();
  renderSimilarityPanel();
}

function onLayerChange(event) {
  applySelectedLayer(event.target.value);
  clearHover();
}

function onThresholdChange(event) {
  thresholdValue.textContent = Number(event.target.value).toFixed(2);
  updateBallTreeGeometry();
}

function toggleCategory(category) {
  if (!category) {
    return;
  }

  if (activeCategories.has(category)) {
    activeCategories.delete(category);
  } else {
    activeCategories.add(category);
  }

  updateLegendState();
  refreshSeparationScores();
  updateSceneGeometry();
  updateFocusLayerVisuals();
  renderSeparationPanel();
  renderSimilarityPanel();
  clearHover();
}

function setLanguage(nextLang) {
  if (!nextLang || !TRANSLATIONS[nextLang] || nextLang === currentLang) {
    return;
  }

  currentLang = nextLang;
  localStorage.setItem("llm-space-lang", currentLang);
  applyStaticTranslations();
  refreshCategoryLabels();
  updateModeUi();
  updateCameraModeUi();
  renderSeparationPanel();
  renderSimilarityPanel();
  setHoverPanel(hoveredPoint ? {
    token: hoveredPoint.tokenText,
    category: hoveredPoint.category,
    layer: hoveredPoint.layer,
    coords: hoveredPoint.metricPosition,
    svd: hoveredPoint.svd,
    promptText: hoveredPoint.promptText,
    position: hoveredPoint.position,
    attention: hoveredPoint.attention,
    activation: hoveredPoint.activationStrength,
  } : null);
}

function setProjectionSource(nextSource) {
  if (!nextSource || !DATASET_FILE_BY_PROJECTION[nextSource]) {
    return;
  }

  const sourceChanged = nextSource !== currentProjectionSource;
  const modeChanged = currentAppMode !== "space";
  currentProjectionSource = nextSource;
  currentAppMode = "space";
  localStorage.setItem("llm-space-projection-source", currentProjectionSource);
  localStorage.setItem("llm-space-app-mode", currentAppMode);

  if (sourceChanged) {
    window.location.reload();
    return;
  }

  if (modeChanged) {
    applyStaticTranslations();
    updateAppModeUi();
    updatePanelUi();
    updateSceneGeometry();
    updateFocusLayerVisuals();
    renderSimilarityPanel();
    clearHover();
  }
}

function setAppMode(nextMode) {
  if (!nextMode || nextMode === currentAppMode || !["space", "heatmap"].includes(nextMode)) {
    return;
  }

  currentAppMode = nextMode;
  localStorage.setItem("llm-space-app-mode", currentAppMode);
  applyStaticTranslations();
  updateAppModeUi();
  updatePanelUi();
  updateSceneGeometry();
  updateFocusLayerVisuals();
  renderSimilarityPanel();
  clearHover();
}

function setViewMode(nextMode) {
  if (!nextMode || nextMode === viewMode) {
    return;
  }

  viewMode = nextMode;
  updateModeUi();
  updateSceneGeometry();
  updateFocusLayerVisuals();
  renderSeparationPanel();
  renderSimilarityPanel();
  clearHover();
}

function setCameraMode(nextMode) {
  if (!nextMode || nextMode === cameraMode) {
    return;
  }

  cameraMode = nextMode;
  updateCameraModeUi();

  if (cameraMode === "focus") {
    updateDesiredFocusTarget();
  } else {
    focusAnimation = 0;
  }

  clearHover();
}

function togglePanel(panelId) {
  if (!panelId) {
    return;
  }

  if (openPanels.has(panelId)) {
    openPanels.delete(panelId);
  } else {
    openPanels.add(panelId);
  }

  updatePanelUi();
}

function t(key, values = {}) {
  const template = TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.tr[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token) => `${values[token] ?? ""}`);
}

function categoryLabel(category) {
  return t(`category_${category}`);
}

function updateAppModeUi() {
  const heatmap = currentAppMode === "heatmap";
  document.body.classList.toggle("app-mode-heatmap", heatmap);
  document.body.classList.toggle("app-mode-space", !heatmap);

  horizontalGuides.visible = !heatmap;
  categoryGuides.visible = !heatmap && viewMode !== "latent";
  categoryLabels.visible = !heatmap && viewMode !== "latent";
  layerLabels.visible = !heatmap;
  points.visible = !heatmap;
  tokenTraceLines.visible = !heatmap && (viewMode !== "latent" || visibleLayerList.length > 1);
  ballLines.visible = !heatmap;
  focusGuide.visible = !heatmap;
  bestLayerGuide.visible = !heatmap;
  layerSlicesGroup.visible = !heatmap;
  activityHotspotGroup.visible = !heatmap && viewMode !== "latent";
  selectionRing.visible = !heatmap && selectionRing.visible;
  heatmapSceneGroup.visible = false;
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  headerSubtitle.textContent = `${t(currentAppMode === "heatmap" ? "tabHeatmap" : "tabSpace")} · ${currentProjectionSource.toUpperCase()}`;
  projectionPcaButton.textContent = t("projectionPca");
  projectionUmapButton.textContent = t("projectionUmap");
  projectionHeatmapButton.textContent = t("tabHeatmap");
  panelAboutButton.textContent = t("panelAbout");
  panelControlsButton.textContent = t("panelControls");
  panelLegendButton.textContent = t("panelLegend");
  panelAnalysisButton.textContent = t("panelAnalysis");
  panelHoverButton.textContent = t("panelHover");
  heroLede.textContent = t("heroLede");
  tokenCountChip.textContent = t("tokenCount", { count: dataset.tokens.length });
  layerRangeChip.textContent = t("layerRange", { min: layerMin, max: layerMax });
  datasetChip.textContent = dataset.sourceLabel;
  viewLabel.textContent = t("viewLabel");
  viewLatentButton.textContent = t("viewLatent");
  viewAtlasButton.textContent = t("viewAtlas");
  cameraLabel.textContent = t("cameraLabel");
  cameraFocusButton.textContent = t("cameraFocus");
  cameraFreeButton.textContent = t("cameraFree");
  layerSliderLabel.textContent = t("layerSliderLabel");
  layerVisibilityLabel.textContent = t("layerVisibilityLabel");
  visibleLayerCurrentButton.textContent = t("layerVisibilityCurrent");
  visibleLayerAllButton.textContent = t("layerVisibilityAll");
  visibleLayerCustomButton.textContent = t("layerVisibilityCustom");
  applyLayerSelectionButton.textContent = t("layerVisibilityApply");
  layerSelectionInput.placeholder = t("layerVisibilityPlaceholder");
  thresholdSliderLabel.textContent = t("thresholdSliderLabel");
  layerFocusBoxLabel.textContent = t("layerFocusBoxLabel");
  connectionCountLabel.textContent = t("connectionCountLabel");
  pcaVarianceLabel.textContent = t("pcaVarianceLabel");
  navigationLabel.textContent = t("navigationLabel");
  hoverLabel.textContent = t("hoverLabel");
  hoverDetailLabel.textContent = t("hoverDetailLabel");
  legendTitle.textContent = t("legendTitle");
  legendMathLabel.textContent = categoryLabel("math");
  legendMathDesc.textContent = t("legendMathDesc");
  legendLanguageLabel.textContent = categoryLabel("language");
  legendLanguageDesc.textContent = t("legendLanguageDesc");
  legendCodeLabel.textContent = categoryLabel("code");
  legendCodeDesc.textContent = t("legendCodeDesc");
  legendLogicLabel.textContent = categoryLabel("logic");
  legendLogicDesc.textContent = t("legendLogicDesc");
  hoverEmpty.textContent = t("hoverEmpty");
  separationEmpty.textContent = t("separationEmpty");
  similarityEmpty.textContent = t("similarityEmpty");
  wAxisReadout.textContent = `${t("layerWord")} ${selectedLayer}`;
  langButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.lang === currentLang ? "true" : "false");
  });
  projectionPcaButton.setAttribute("aria-pressed", currentAppMode === "space" && currentProjectionSource === "pca" ? "true" : "false");
  projectionUmapButton.setAttribute("aria-pressed", currentAppMode === "space" && currentProjectionSource === "umap" ? "true" : "false");
  projectionHeatmapButton.setAttribute("aria-pressed", currentAppMode === "heatmap" ? "true" : "false");
  updateLayerVisibilityUi();
}

function setLayerVisibilityMode(nextMode) {
  if (!nextMode || nextMode === layerVisibilityMode) {
    return;
  }

  layerVisibilityMode = nextMode;
  if (layerVisibilityMode === "custom") {
    const parsedLayers = parseLayerSelection(layerSelectionInput.value);
    customVisibleLayers = parsedLayers.length ? parsedLayers : [selectedLayer];
  }

  syncVisibleLayers();
  updateSceneGeometry();
  updateFocusLayerVisuals();
  renderSeparationPanel();
  renderSimilarityPanel();
  clearHover();
}

function applyCustomLayerSelection() {
  const parsedLayers = parseLayerSelection(layerSelectionInput.value);
  customVisibleLayers = parsedLayers.length ? parsedLayers : [selectedLayer];
  layerVisibilityMode = "custom";
  syncVisibleLayers();
  updateSceneGeometry();
  updateFocusLayerVisuals();
  renderSeparationPanel();
  renderSimilarityPanel();
  clearHover();
}

function syncVisibleLayers() {
  if (layerVisibilityMode === "all") {
    visibleLayerList = [...allLayers];
  } else if (layerVisibilityMode === "custom") {
    visibleLayerList = normalizeLayerList(customVisibleLayers.length ? customVisibleLayers : [selectedLayer]);
  } else {
    visibleLayerList = [selectedLayer];
  }

  visibleLayerSet = new Set(visibleLayerList);
  layerSelectionInput.value = formatLayerSelectionString(
    layerVisibilityMode === "custom" ? customVisibleLayers : visibleLayerList,
  );
  updateLayerVisibilityUi();
}

function updateLayerVisibilityUi() {
  if (!layerVisibilityReadout) {
    return;
  }

  const summaryLabel = layerVisibilityMode === "all"
    ? t("layerVisibilitySummaryAll")
    : layerVisibilityMode === "custom"
      ? t("layerVisibilitySummaryCustom")
      : t("layerVisibilitySummaryCurrent");
  const layerSummary = layerVisibilityMode === "current"
    ? `${selectedLayer}`
    : formatLayerSelectionString(layerVisibilityMode === "custom" ? customVisibleLayers : visibleLayerList);

  layerVisibilityReadout.textContent = `${summaryLabel} · ${layerSummary}`;
  visibleLayerButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.layerVisibility === layerVisibilityMode);
  });
}

function updateSceneGeometry() {
  visiblePointInstances = dataset.pointInstances.filter((point) => (
    activeCategories.has(point.category) &&
    visibleLayerSet.has(point.layer)
  ));
  spaceFrameProfile = computeSpaceFrame(visiblePointInstances);
  updatePointsGeometry();
  updateTokenTraceGeometry();
  updateBallTreeGeometry();
  updateLegendState();
  updateHeatmapScene();
}

function updateModeUi() {
  const latent = viewMode === "latent";
  modeReadout.textContent = latent ? t("viewLatent") : t("viewAtlas");
  legendModeLabel.textContent = latent
    ? (visibleLayerList.length > 1 ? t("legendLatentFallback") : buildLatentLegendLabel(selectedLayer))
    : t("legendAtlas");
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewMode === viewMode);
  });
  if (currentAppMode !== "heatmap") {
    categoryGuides.visible = !latent;
    categoryLabels.visible = !latent;
    tokenTraceLines.visible = !latent || visibleLayerList.length > 1;
    activityHotspotGroup.visible = !latent;
  }
}

function updatePanelUi() {
  const panelMap = {
    heroPanel,
    controlsPanel,
    legendPanel,
    hoverPanel,
    separationPanel,
    similarityPanel,
  };

  Object.entries(panelMap).forEach(([panelId, panel]) => {
    if (!panel) {
      return;
    }
    const shouldShow = currentAppMode === "heatmap"
      ? panelId === "similarityPanel"
      : (panelId !== "similarityPanel" && openPanels.has(panelId));
    panel.classList.toggle("is-collapsed", !shouldShow);
  });

  headerButtons.forEach((button) => {
    const expanded = currentAppMode === "heatmap" ? false : openPanels.has(button.dataset.panelTarget);
    button.setAttribute("aria-pressed", expanded ? "true" : "false");
  });
}

function refreshCategoryLabels() {
  if (!scene) {
    return;
  }
  scene.remove(categoryLabels);
  categoryLabels = createCategoryLabels();
  categoryLabels.visible = viewMode !== "latent";
  scene.add(categoryLabels);
}

function updateCameraModeUi() {
  const free = cameraMode === "free";
  cameraModeReadout.textContent = free ? t("cameraFree") : t("cameraFocus");
  navigationReadout.textContent = free ? t("navigationFree") : t("navigationFocus");
  cameraModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.cameraMode === cameraMode);
  });

  controls.enablePan = free;
  controls.screenSpacePanning = free;
  controls.minPolarAngle = free ? 0.2 : 1.02;
  controls.maxPolarAngle = free ? Math.PI - 0.2 : 1.02;
  controls.minAzimuthAngle = free ? -Infinity : -Infinity;
  controls.maxAzimuthAngle = free ? Infinity : Infinity;
  controls.minDistance = free ? 0.8 : 2.1;
  controls.maxDistance = free ? 30 : 16;
}

function getPointPosition(point) {
  if (viewMode === "latent") {
    return projectMetricPosition(point.metricPosition, point.layer, dataset.latentBoundsByLayer[point.layer]);
  }
  return point.atlasPosition;
}

function getLayerEntryPosition(layerEntry) {
  if (viewMode === "latent") {
    return projectMetricPosition(layerEntry.metricPosition, layerEntry.layer, dataset.latentBoundsByLayer[layerEntry.layer]);
  }
  return layerEntry.renderPosition;
}

function buildLatentLegendLabel(layer) {
  if (dataset.projectionMethod === "umap") {
    return "True latent / UMAP-3D";
  }
  const bounds = dataset.latentBoundsByLayer[layer];
  if (!bounds) {
    return t("legendLatentFallback");
  }
  return t("latentLegendAdaptive", { a: bounds.compA + 1, b: bounds.compB + 1 });
}

function updatePointsGeometry() {
  const positions = new Float32Array(visiblePointInstances.length * 3);
  const colors = new Float32Array(visiblePointInstances.length * 3);
  const sizes = new Float32Array(visiblePointInstances.length);

  visiblePointInstances.forEach((point, index) => {
    const pointPosition = getPointPosition(point);
    const writeOffset = index * 3;
    positions[writeOffset] = pointPosition[0];
    positions[writeOffset + 1] = pointPosition[1];
    positions[writeOffset + 2] = pointPosition[2];

    const color = new THREE.Color(point.color);
    colors[writeOffset] = color.r;
    colors[writeOffset + 1] = color.g;
    colors[writeOffset + 2] = color.b;
    sizes[index] = point.size;
  });

  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  pointsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  pointsGeometry.computeBoundingSphere();
}

function updateTokenTraceGeometry() {
  const linePositions = [];
  const lineColors = [];
  const traceLayers = [...visibleLayerList].sort((left, right) => left - right);

  dataset.tokens.forEach((token) => {
    if (!activeCategories.has(token.category)) {
      return;
    }

    const color = new THREE.Color((CATEGORY_CONFIG[token.category] ?? CATEGORY_CONFIG.language).color);
    for (let index = 0; index < traceLayers.length - 1; index += 1) {
      const current = token.layers[traceLayers[index]];
      const next = token.layers[traceLayers[index + 1]];
      if (!current || !next) {
        continue;
      }
      const currentPosition = getLayerEntryPosition(current);
      const nextPosition = getLayerEntryPosition(next);
      linePositions.push(
        currentPosition[0], currentPosition[1], currentPosition[2],
        nextPosition[0], nextPosition[1], nextPosition[2],
      );
      lineColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
  });

  tokenTraceGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  tokenTraceGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
  tokenTraceGeometry.computeBoundingSphere();
}

function updateBallTreeGeometry() {
  const layerPoints = dataset.pointInstances.filter((point) => (
    activeCategories.has(point.category) &&
    point.layer === selectedLayer &&
    visibleLayerSet.has(point.layer)
  ));
  const effectiveThreshold = viewMode === "latent"
    ? Number(thresholdSlider.value) * 0.1
    : Number(thresholdSlider.value);
  const edges = computeRadiusEdges(layerPoints, effectiveThreshold);

  const linePositions = new Float32Array(edges.length * 6);
  const lineColors = new Float32Array(edges.length * 6);

  edges.forEach((edge, edgeIndex) => {
    const positionA = getPointPosition(edge.a);
    const positionB = getPointPosition(edge.b);
    const writeOffset = edgeIndex * 6;
    const colorA = new THREE.Color(edge.a.color);
    const colorB = new THREE.Color(edge.b.color);

    linePositions[writeOffset] = positionA[0];
    linePositions[writeOffset + 1] = positionA[1];
    linePositions[writeOffset + 2] = positionA[2];
    linePositions[writeOffset + 3] = positionB[0];
    linePositions[writeOffset + 4] = positionB[1];
    linePositions[writeOffset + 5] = positionB[2];

    lineColors[writeOffset] = colorA.r;
    lineColors[writeOffset + 1] = colorA.g;
    lineColors[writeOffset + 2] = colorA.b;
    lineColors[writeOffset + 3] = colorB.r;
    lineColors[writeOffset + 4] = colorB.g;
    lineColors[writeOffset + 5] = colorB.b;
  });

  ballLinesGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  ballLinesGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
  ballLinesGeometry.computeBoundingSphere();
  edgeCount.textContent = `${edges.length}`;
}

function updateFocusLayerVisuals() {
  focusGuide.position.y = layerToY(selectedLayer);
  updateLayerSlices();
  updateActivityHotspots();
  updateHeatmapScene();
  updateDesiredFocusTarget();
}

function updateHover() {
  const hovered = pickHoveredPoint();
  if (!hovered) {
    if (hoveredPoint !== null) {
      hoveredPoint = null;
      selectionRing.visible = false;
      hideTooltip();
      setHoverPanel(null);
    }
    return;
  }

  hoveredPoint = hovered;
  selectionRing.visible = true;
  selectionRing.position.set(...getPointPosition(hovered));
  selectionRing.material.color.set(hovered.color);
  const sizeScale = Math.max(0.72, hovered.size / 11);
  selectionRing.scale.set(sizeScale, sizeScale, 1);

  const category = CATEGORY_CONFIG[hovered.category] ?? CATEGORY_CONFIG.language;
  tooltip.classList.remove("hidden");
  tooltip.innerHTML = `<strong>${escapeHtml(formatTokenForDisplay(hovered.tokenText))}</strong><span>${categoryLabel(hovered.category)} - ${t("layerWord")} ${hovered.layer}</span>`;

  setHoverPanel({
    token: hovered.tokenText,
    category: hovered.category,
    layer: hovered.layer,
    coords: hovered.metricPosition,
    svd: hovered.svd,
    promptText: hovered.promptText,
    position: hovered.position,
    attention: hovered.attention,
    activation: hovered.activationStrength,
  });
}

function pickHoveredPoint() {
  const mouseX = ((pointer.x + 1) * 0.5) * window.innerWidth;
  const mouseY = ((1 - pointer.y) * 0.5) * window.innerHeight;
  let bestPoint = null;
  let bestDistance = HOVER_PIXEL_RADIUS;
  let bestDepth = Infinity;

  for (const point of visiblePointInstances) {
    projectedVector.set(...getPointPosition(point)).project(camera);
    if (projectedVector.z < -1 || projectedVector.z > 1) {
      continue;
    }

    const screenX = ((projectedVector.x + 1) * 0.5) * window.innerWidth;
    const screenY = ((1 - projectedVector.y) * 0.5) * window.innerHeight;
    const dx = screenX - mouseX;
    const dy = screenY - mouseY;
    const distancePx = Math.sqrt(dx * dx + dy * dy);

    if (distancePx > bestDistance) {
      continue;
    }

    if (distancePx < bestDistance || projectedVector.z < bestDepth) {
      bestDistance = distancePx;
      bestDepth = projectedVector.z;
      bestPoint = point;
    }
  }

  return bestPoint;
}

function clearHover() {
  pointer.x = 2;
  pointer.y = 2;
  hoveredPoint = null;
  selectionRing.visible = false;
  hideTooltip();
  setHoverPanel(null);
}

function onPointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSeparationPanelClick(event) {
  const row = event.target.closest(".layer-score-item[data-layer]");
  if (!row) {
    return;
  }

  applySelectedLayer(row.dataset.layer);
  clearHover();
}

function onSimilarityPanelInput(event) {
  if (event.target.id !== "heatmapLayerSlider") {
    return;
  }

  applySelectedLayer(event.target.value);
  clearHover();
}

function renderSeparationPanelLegacy() {
  const hotspotCount = computeLayerActivityHotspots(dataset.pointInstances, selectedLayer, activeCategories).length;
  const maxScore = Math.max(...layerScores.map((row) => row.score), 1e-6);
  const rows = layerScores
    .map((row) => `
      <div class="layer-score-item ${row.layer === bestLayerRow.layer ? "is-best" : ""} ${row.layer === selectedLayer ? "is-selected" : ""}" data-layer="${row.layer}">
        <span class="layer-score-label">L${row.layer}</span>
        <div class="layer-score-bar">
          <span class="layer-score-fill" style="width:${(row.score / maxScore) * 100}%"></span>
        </div>
        <span class="layer-score-value">${row.score.toFixed(2)}</span>
      </div>
    `)
    .join("");

  const selectedRow = layerScores.find((row) => row.layer === selectedLayer) ?? bestLayerRow;
  separationPanel.innerHTML = `
    <div class="separation-header">
      <div>
        <h3>Katman Ayrisma Skoru</h3>
        <p>Kategoriler arasi ortalama mesafe. En yuksek skor router icin en net ayrisan katman.</p>
      </div>
      <div class="score-badge">Best L${bestLayerRow.layer}</div>
    </div>
    <div class="hover-grid">
      <p><strong>Uzay cercevesi:</strong> ${spaceFrameProfile.shapeLabel}</p>
      <p><strong>Aktif bolge:</strong> ${hotspotCount} soru bolgesi</p>
      <p><strong>Secili katman:</strong> L${selectedRow.layer} · skor ${selectedRow.score.toFixed(2)}</p>
      <p><strong>Optimal katman:</strong> L${bestLayerRow.layer} · skor ${bestLayerRow.score.toFixed(2)}</p>
    </div>
    <div class="layer-score-list">${rows}</div>
  `;
}

function setHoverPanelLegacy(payload) {
  if (!payload) {
    hoverPanel.innerHTML = `
      <div class="hover-empty">
        Bir tokenin ustune gelince token metni, katman ve aktif SVD bilesenleri burada gorunecek.
      </div>
    `;
    return;
  }

  const category = CATEGORY_CONFIG[payload.category] ?? CATEGORY_CONFIG.language;
  const coordsLabel = dataset.projectionMethod === "umap" ? t("umapPosition") : t("pcaPosition");
  const componentPills = payload.svd
    .map((component) => `<span class="component-pill">${component.name} ${formatSigned(component.value)}</span>`)
    .join("");

  const attentionBlock = payload.attention
    ? `
      <p><strong>QK skor ozet:</strong> mean=${payload.attention.scoreMean.toFixed(2)}, min=${payload.attention.scoreMin.toFixed(2)}, max=${payload.attention.scoreMax.toFixed(2)}</p>
      <p><strong>Top anahtarlar:</strong> ${payload.attention.topKeys.map((item) => `${escapeHtml(item.token)}@${item.position}`).join(", ") || "-"}</p>
    `
    : "";

  hoverPanel.innerHTML = `
    <div class="hover-card-header">
      <div><p class="hover-token">${escapeHtml(payload.token)}</p></div>
      <span class="hover-category ${payload.category}">${category.label}</span>
    </div>
    <div class="hover-grid">
      <p><strong>Katman:</strong> ${payload.layer}</p>
      <p><strong>Pozisyon:</strong> ${payload.position}</p>
      <p><strong>Aktivasyon siddeti:</strong> ${payload.activation.toFixed(2)}</p>
      <p><strong>${coordsLabel}:</strong> x=${payload.coords[0].toFixed(2)}, y=${payload.coords[1].toFixed(2)}, z=${payload.coords[2].toFixed(2)}</p>
      <p><strong>Prompt:</strong> ${escapeHtml(payload.promptText)}</p>
      <p><strong>Aktif SVD bilesenleri:</strong></p>
      <div class="component-list">${componentPills}</div>
      ${attentionBlock}
    </div>
  `;
}

function hideTooltip() {
  tooltip.classList.add("hidden");
}

function renderSeparationPanel() {
  const hotspotCount = computeLayerActivityHotspots(dataset.pointInstances, selectedLayer, activeCategories).length;
  const maxScore = Math.max(...layerScores.map((row) => row.score), 1e-6);
  const rows = layerScores
    .map((row) => `
      <div class="layer-score-item ${row.layer === bestLayerRow.layer ? "is-best" : ""} ${row.layer === selectedLayer ? "is-selected" : ""}" data-layer="${row.layer}">
        <span class="layer-score-label">L${row.layer}</span>
        <div class="layer-score-bar">
          <span class="layer-score-fill" style="width:${(row.score / maxScore) * 100}%"></span>
        </div>
        <span class="layer-score-value">${row.score.toFixed(2)}</span>
      </div>
    `)
    .join("");

  const selectedRow = layerScores.find((row) => row.layer === selectedLayer) ?? bestLayerRow;
  separationPanel.innerHTML = `
    <div class="separation-header">
      <div>
        <h3>${t("separationTitle")}</h3>
        <p>${t("separationDescription")}</p>
      </div>
      <div class="score-badge">${t("bestLayerShort", { layer: bestLayerRow.layer })}</div>
    </div>
    <div class="hover-grid">
      <p><strong>${t("spaceFrame")}:</strong> ${spaceFrameProfile.shapeLabel}</p>
      <p><strong>${t("activeRegion")}:</strong> ${t("regionCount", { count: hotspotCount })}</p>
      <p><strong>${t("selectedLayer")}:</strong> L${selectedRow.layer} · ${t("scoreWord")} ${selectedRow.score.toFixed(2)}</p>
      <p><strong>${t("optimalLayer")}:</strong> L${bestLayerRow.layer} · ${t("scoreWord")} ${bestLayerRow.score.toFixed(2)}</p>
    </div>
    <div class="layer-score-list">${rows}</div>
  `;
}

function renderSimilarityPanel() {
  const similarityMeta = dataset.categorySimilarity;
  const byLayer = similarityMeta?.byLayer ?? similarityMeta?.by_layer;
  if (!byLayer) {
    similarityPanel.innerHTML = `
      <div class="hover-empty">
        ${t("similarityUnavailable")}
      </div>
    `;
    return;
  }

  const layerEntry = byLayer[String(selectedLayer)];
  if (!layerEntry?.matrix?.length) {
    similarityPanel.innerHTML = `
      <div class="hover-empty">
        ${t("similarityUnavailable")}
      </div>
    `;
    return;
  }

  const categories = similarityMeta.categories ?? CATEGORY_ORDER;
  const matrix = layerEntry.matrix;
  const withinValues = categories
    .map((_, index) => matrix[index]?.[index])
    .filter((value) => typeof value === "number");
  const betweenValues = matrix.flatMap((row, rowIndex) => (
    row.flatMap((value, colIndex) => (rowIndex !== colIndex && typeof value === "number" ? [value] : []))
  ));
  const withinAverage = withinValues.length
    ? withinValues.reduce((sum, value) => sum + value, 0) / withinValues.length
    : null;
  const betweenAverage = betweenValues.length
    ? betweenValues.reduce((sum, value) => sum + value, 0) / betweenValues.length
    : null;
  const diagonalEntries = categories
    .map((category, index) => ({ category, value: matrix[index]?.[index] }))
    .filter((entry) => typeof entry.value === "number")
    .sort((left, right) => right.value - left.value)
    .map((entry) => `<span class="component-pill">${escapeHtml(categoryLabel(entry.category))} ${entry.value.toFixed(2)}</span>`)
    .join("");
  const heatmapSvg = buildSimilarityHeatmapSvg(categories, matrix);

  similarityPanel.innerHTML = `
    <div class="similarity-header">
      <div>
        <h3>${t("similarityTitle")}</h3>
        <p>${t("similarityDescription")}</p>
      </div>
      <div class="score-badge">${t("similarityLayerBadge", { layer: selectedLayer })}</div>
    </div>
    <div class="heatmap-toolbar">
      <label for="heatmapLayerSlider">${t("heatmapLayerLabel")}</label>
      <input id="heatmapLayerSlider" type="range" min="${layerMin}" max="${layerMax}" step="1" value="${selectedLayer}">
      <strong class="score-badge">L${selectedLayer}</strong>
    </div>
    <div class="similarity-legend">
      <span>${t("similarityLow")}</span>
      <div class="similarity-gradient"></div>
      <span>${t("similarityHigh")}</span>
    </div>
    <div class="heatmap-stage">
      ${heatmapSvg}
    </div>
    <div class="hover-grid">
      <p><strong>${t("selectedLayer")}:</strong> L${selectedLayer}</p>
      <p><strong>${t("positionWord")}:</strong> ${dataset.projectionMethod.toUpperCase()} latent layer</p>
      <div class="component-list">${diagonalEntries || '<span class="component-pill">-</span>'}</div>
    </div>
    <div class="similarity-stats">
      <div class="similarity-stat">
        <span>${t("similarityWithin")}</span>
        <strong>${withinAverage == null ? "-" : withinAverage.toFixed(3)}</strong>
      </div>
      <div class="similarity-stat">
        <span>${t("similarityBetween")}</span>
        <strong>${betweenAverage == null ? "-" : betweenAverage.toFixed(3)}</strong>
      </div>
    </div>
  `;
}

function buildSimilarityHeatmapSvg(categories, matrix) {
  const cellSize = 126;
  const labelBand = 124;
  const topBand = 108;
  const outerPadding = 18;
  const width = labelBand + (categories.length * cellSize) + outerPadding;
  const height = topBand + (categories.length * cellSize) + outerPadding;

  const labelMarkup = categories.map((category, index) => {
    const x = labelBand + (index * cellSize) + (cellSize / 2);
    const y = topBand + (index * cellSize) + (cellSize / 2);
    return `
      <text class="heatmap-svg-label heatmap-svg-label-top" x="${x}" y="54">${escapeHtml(categoryLabel(category))}</text>
      <text class="heatmap-svg-label heatmap-svg-label-left" x="54" y="${y}">${escapeHtml(categoryLabel(category))}</text>
    `;
  }).join("");

  const cellsMarkup = categories.map((rowCategory, rowIndex) => (
    categories.map((columnCategory, columnIndex) => {
      const value = matrix[rowIndex]?.[columnIndex];
      const safeValue = typeof value === "number" ? value : null;
      const x = labelBand + (columnIndex * cellSize) + 6;
      const y = topBand + (rowIndex * cellSize) + 6;
      const fill = safeValue == null ? "rgba(255,255,255,0.04)" : similarityToColor(safeValue);
      const stroke = rowIndex === columnIndex ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)";
      const valueText = safeValue == null ? "-" : safeValue.toFixed(3);
      const relationText = rowIndex === columnIndex ? t("similarityWithinShort") : t("similarityCrossShort");
      const textColor = safeValue != null && safeValue > 0.38 ? "#08131d" : "#eef3f7";
      return `
        <g class="heatmap-svg-cell-group" transform="translate(${x}, ${y})">
          <rect class="heatmap-svg-cell" width="${cellSize - 12}" height="${cellSize - 12}" rx="24" ry="24" fill="${fill}" stroke="${stroke}" />
          <text class="heatmap-svg-value" x="${(cellSize - 12) / 2}" y="${((cellSize - 12) / 2) - 6}" fill="${textColor}">${valueText}</text>
          <text class="heatmap-svg-note" x="${(cellSize - 12) / 2}" y="${((cellSize - 12) / 2) + 22}" fill="${textColor}">${relationText}</text>
        </g>
      `;
    }).join("")
  )).join("");

  return `
    <svg class="heatmap-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(t("similarityTitle"))}">
      <rect class="heatmap-svg-frame" x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="34" ry="34"></rect>
      ${labelMarkup}
      ${cellsMarkup}
    </svg>
  `;
}

function similarityToColor(value) {
  const clamped = THREE.MathUtils.clamp((value + 1) / 2, 0, 1);
  const hue = lerp(6, 138, clamped);
  const saturation = lerp(62, 54, clamped);
  const lightness = lerp(44, 58, clamped);
  return `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`;
}

function setHoverPanel(payload) {
  if (!payload) {
    hoverPanel.innerHTML = `
      <div class="hover-empty">
        ${t("hoverEmpty")}
      </div>
    `;
    return;
  }

  const coordsLabel = dataset.projectionMethod === "umap" ? t("umapPosition") : t("pcaPosition");
  const componentPills = payload.svd
    .map((component) => `<span class="component-pill">${component.name} ${formatSigned(component.value)}</span>`)
    .join("");

  const attentionBlock = payload.attention
    ? `
      <p><strong>${t("qkSummary")}:</strong> mean=${payload.attention.scoreMean.toFixed(2)}, min=${payload.attention.scoreMin.toFixed(2)}, max=${payload.attention.scoreMax.toFixed(2)}</p>
      <p><strong>${t("topKeys")}:</strong> ${payload.attention.topKeys.map((item) => `${escapeHtml(formatTokenForDisplay(item.token))}@${item.position}`).join(", ") || "-"}</p>
    `
    : "";

  hoverPanel.innerHTML = `
    <div class="hover-card-header">
      <div><p class="hover-token">${escapeHtml(formatTokenForDisplay(payload.token))}</p></div>
      <span class="hover-category ${payload.category}">${categoryLabel(payload.category)}</span>
    </div>
    <div class="hover-grid">
      <p><strong>${t("layerWord")}:</strong> ${payload.layer}</p>
      <p><strong>${t("positionWord")}:</strong> ${payload.position}</p>
      <p><strong>${t("activationStrength")}:</strong> ${payload.activation.toFixed(2)}</p>
      <p><strong>${coordsLabel}:</strong> x=${payload.coords[0].toFixed(2)}, y=${payload.coords[1].toFixed(2)}, z=${payload.coords[2].toFixed(2)}</p>
      <p><strong>${t("promptWord")}:</strong> ${escapeHtml(payload.promptText)}</p>
      <p><strong>${t("activeSvd")}:</strong></p>
      <div class="component-list">${componentPills}</div>
      ${attentionBlock}
    </div>
  `;
}

function updateWMarker(layer) {
  const ratio = (layer - layerMin) / Math.max(layerMax - layerMin, 1);
  wMarker.style.left = `calc(4px + (100% - 8px) * ${ratio})`;
}

function updateWTicks() {
  const tickCount = Math.max(wTicks.length - 1, 1);
  wTicks.forEach((tick, index) => {
    const value = lerp(layerMin, layerMax, index / tickCount);
    tick.textContent = `${Math.round(value)}`;
  });
}

function updateLegendState() {
  legendItems.forEach((item) => {
    const enabled = activeCategories.has(item.dataset.category);
    item.classList.toggle("is-off", !enabled);
    item.setAttribute("aria-pressed", enabled ? "true" : "false");
  });
}

function createPointMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexColors: true,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: `
      attribute float size;
      uniform float uPixelRatio;
      varying vec3 vColor;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = size * uPixelRatio;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);
        if (dist > 0.5) {
          discard;
        }
        float alpha = smoothstep(0.5, 0.12, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });
}

function createHorizontalGuides() {
  const group = new THREE.Group();
  for (let layer = layerMin; layer <= layerMax; layer += 1) {
    const major = layer % 4 === 0;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(GUIDE_MIN_X, layerToY(layer), -0.4),
      new THREE.Vector3(GUIDE_MAX_X, layerToY(layer), -0.4),
    ]);
    const material = new THREE.LineBasicMaterial({
      color: major ? 0x27445c : 0x1f3142,
      transparent: true,
      opacity: major ? 0.26 : 0.12,
    });
    group.add(new THREE.Line(geometry, material));
  }
  return group;
}

function createCategoryGuides() {
  const group = new THREE.Group();
  CATEGORY_ORDER.forEach((category) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(CATEGORY_X[category], layerToY(layerMin), -0.6),
      new THREE.Vector3(CATEGORY_X[category], layerToY(layerMax), -0.6),
    ]);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color((CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.language).color),
      transparent: true,
      opacity: 0.16,
    });
    group.add(new THREE.Line(geometry, material));
  });
  return group;
}

function createCategoryLabels() {
  const group = new THREE.Group();
  CATEGORY_ORDER.forEach((category) => {
    group.add(
      createTextSprite(
        categoryLabel(category),
        CATEGORY_CONFIG[category].color,
        new THREE.Vector3(CATEGORY_X[category], layerToY(layerMin) - 0.9, 0),
        1.6,
      ),
    );
  });
  return group;
}

function createLayerLabels(minLayer, maxLayer) {
  const group = new THREE.Group();
  for (let layer = minLayer; layer <= maxLayer; layer += 4) {
    group.add(createTextSprite(`L${layer}`, "#9dafbd", new THREE.Vector3(-1.9, layerToY(layer), 0), 0.95));
  }
  return group;
}

function createGuideLine(color, opacity) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(GUIDE_MIN_X, 0, 0.22),
    new THREE.Vector3(GUIDE_MAX_X, 0, 0.22),
  ]);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  return new THREE.Line(geometry, material);
}

function createTextSprite(text, color, position, scale = 1.4) {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 320;
  spriteCanvas.height = 96;
  const ctx = spriteCanvas.getContext("2d");
  ctx.font = "700 36px Space Grotesk";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, 160, 58);
  const material = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(spriteCanvas),
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(2.2 * scale, 0.6 * scale, 1);
  return sprite;
}

function createRingSprite() {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 128;
  spriteCanvas.height = 128;
  const ctx = spriteCanvas.getContext("2d");
  ctx.clearRect(0, 0, 128, 128);
  ctx.beginPath();
  ctx.arc(64, 64, 38, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.98)";
  ctx.lineWidth = 10;
  ctx.shadowColor = "rgba(255,255,255,0.32)";
  ctx.shadowBlur = 8;
  ctx.stroke();
  return new THREE.CanvasTexture(spriteCanvas);
}

function createGlowTexture() {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 128;
  spriteCanvas.height = 128;
  const ctx = spriteCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 58);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.36)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(spriteCanvas);
}

function createLayerSlicePrototype() {
  const shape = createRoundedRectShape(1, 1, 0.14);
  const fillGeometry = new THREE.ShapeGeometry(shape);
  fillGeometry.rotateX(-Math.PI / 2);
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(
    shape.getPoints(48).map((point) => new THREE.Vector3(point.x, 0, point.y)),
  );

  return { fillGeometry, outlineGeometry };
}

function createLayerSlice({ layer, selected }) {
  const fill = new THREE.Mesh(
    layerSlicePrototype.fillGeometry,
    new THREE.MeshBasicMaterial({
      color: selected ? 0x7bd6ff : 0xe7eef8,
      transparent: true,
      opacity: selected ? 0.08 : 0.032,
      depthWrite: false,
    }),
  );

  const outline = new THREE.LineLoop(
    layerSlicePrototype.outlineGeometry,
    new THREE.LineBasicMaterial({
      color: selected ? 0xa7e2ff : 0xbccddd,
      transparent: true,
      opacity: selected ? 0.4 : 0.18,
    }),
  );

  const group = new THREE.Group();
  group.position.y = layerToY(layer) - 0.022;
  group.renderOrder = selected ? 1 : 0;
  group.add(fill);
  group.add(outline);

  return { group, fill, outline };
}

function createRoundedRectShape(width, height, radius) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);
  return shape;
}

function buildPointInstances(sourceDataset) {
  const allActivation = [];
  const metricBoundsByLayer = sourceDataset.latentBoundsByLayer ?? computeLayerLatentBounds(sourceDataset.tokens);
  sourceDataset.tokens.forEach((token) => {
    token.layers.forEach((layerEntry) => {
      allActivation.push(layerEntry.activationStrength);
    });
  });

  const minActivation = Math.min(...allActivation);
  const maxActivation = Math.max(...allActivation);

  return sourceDataset.tokens.flatMap((token, tokenIndex) => token.layers.map((layerEntry) => {
    const latentPosition = projectMetricPosition(layerEntry.metricPosition, layerEntry.layer, metricBoundsByLayer[layerEntry.layer]);
    layerEntry.latentPosition = latentPosition;
    return {
      tokenIndex,
      tokenText: token.text,
      promptText: token.promptText,
      promptId: token.promptId,
      position: token.position,
      category: token.category,
      color: (CATEGORY_CONFIG[token.category] ?? CATEGORY_CONFIG.language).color,
      layer: layerEntry.layer,
      metricPosition: layerEntry.metricPosition,
      atlasPosition: layerEntry.renderPosition,
      latentPosition,
      svd: layerEntry.svd,
      attention: layerEntry.attention,
      activationStrength: layerEntry.activationStrength,
      size: lerp(4.5, 11, normalizeScalar(layerEntry.activationStrength, minActivation, maxActivation)),
    };
  }));
}

function computePointSizeRange(pointInstances) {
  const sizes = pointInstances.map((point) => point.size);
  return {
    min: Math.min(...sizes),
    max: Math.max(...sizes),
  };
}

function computeLayerLatentBounds(tokens) {
  const bounds = {};
  const candidatePairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];

  tokens.forEach((token) => {
    token.layers.forEach((layerEntry) => {
      if (!bounds[layerEntry.layer]) {
        bounds[layerEntry.layer] = {
          points: [],
        };
      }

      bounds[layerEntry.layer].points.push(layerEntry.metricPosition);
    });
  });

  Object.keys(bounds).forEach((layer) => {
    const layerBounds = bounds[layer];
    let bestPair = null;

    candidatePairs.forEach(([compA, compB]) => {
      const valuesA = layerBounds.points.map((position) => position[compA]);
      const valuesB = layerBounds.points.map((position) => position[compB]);
      const minA = Math.min(...valuesA);
      const maxA = Math.max(...valuesA);
      const minB = Math.min(...valuesB);
      const maxB = Math.max(...valuesB);
      const spanA = Math.max(maxA - minA, 1e-6);
      const spanB = Math.max(maxB - minB, 1e-6);
      const score = spanA * spanB;

      if (!bestPair || score > bestPair.score) {
        bestPair = {
          compA,
          compB,
          minA,
          maxA,
          minB,
          maxB,
          spanA,
          spanB,
          score,
        };
      }
    });

    layerBounds.compA = bestPair.compA;
    layerBounds.compB = bestPair.compB;
    layerBounds.centerX = (bestPair.minA + bestPair.maxA) / 2;
    layerBounds.centerZ = (bestPair.minB + bestPair.maxB) / 2;
    layerBounds.scale = 4.6 / Math.max(bestPair.spanA, bestPair.spanB);
    delete layerBounds.points;
  });

  return bounds;
}

function projectMetricPosition(metricPosition, layer, bounds) {
  return [
    VIEW_TARGET.x + (metricPosition[bounds.compA] - bounds.centerX) * bounds.scale,
    layerToY(layer),
    (metricPosition[bounds.compB] - bounds.centerZ) * bounds.scale,
  ];
}

function computeLayerSeparationScores(sourceDataset, enabledCategories = null) {
  const scores = [];

  for (let layer = layerMin; layer <= layerMax; layer += 1) {
    const perCategory = new Map();
    sourceDataset.tokens.forEach((token) => {
      if (enabledCategories && !enabledCategories.has(token.category)) {
        return;
      }
      const entry = token.layers[layer];
      if (!entry) {
        return;
      }
      if (!perCategory.has(token.category)) {
        perCategory.set(token.category, []);
      }
      perCategory.get(token.category).push(entry.metricPosition);
    });

    const categories = CATEGORY_ORDER.filter((category) => perCategory.has(category) && perCategory.get(category).length);
    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < categories.length; i += 1) {
      for (let j = i + 1; j < categories.length; j += 1) {
        const left = perCategory.get(categories[i]);
        const right = perCategory.get(categories[j]);
        left.forEach((a) => {
          right.forEach((b) => {
            totalDistance += distance(a, b);
            comparisons += 1;
          });
        });
      }
    }

    scores.push({
      layer,
      score: comparisons ? totalDistance / comparisons : 0,
    });
  }

  return scores;
}

function pickBestLayerRow(rows, fallbackLayer) {
  if (!rows.length) {
    return { layer: fallbackLayer, score: 0 };
  }

  return rows.reduce((best, row) => (row.score > best.score ? row : best), rows[0]);
}

function refreshSeparationScores() {
  layerScores = computeLayerSeparationScores(dataset, activeCategories);
  bestLayerRow = pickBestLayerRow(layerScores, selectedLayer);
  bestLayerGuide.position.y = layerToY(bestLayerRow.layer);
  spaceFrameProfile = computeSpaceFrame(dataset.pointInstances, activeCategories);
}

function updateLayerSlices() {
  while (layerSlicesGroup.children.length) {
    const [child] = layerSlicesGroup.children;
    child.traverse((node) => {
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach((material) => material.dispose());
        } else {
          node.material.dispose();
        }
      }
    });
    layerSlicesGroup.remove(child);
  }

  visibleLayerList.forEach((layer) => {
    const layerPoints = dataset.pointInstances.filter((point) => (
      activeCategories.has(point.category) &&
      point.layer === layer
    ));
    const layerFrame = computeSpaceFrame(layerPoints);
    const slice = createLayerSlice({ layer, selected: layer === selectedLayer });
    slice.group.position.x = layerFrame.centerX;
    slice.group.position.z = layerFrame.centerZ;
    slice.group.scale.set(layerFrame.width, 1, layerFrame.depth);
    layerSlicesGroup.add(slice.group);
  });
}

function updateDesiredFocusTarget() {
  if (currentAppMode === "heatmap") {
    const centroids = [...computeHeatmapCentroids(selectedLayer, CATEGORY_ORDER).values()];
    const frame = computeHeatmapFrame(centroids);
    desiredFocusTarget.set(frame.centerX, layerToY(selectedLayer), frame.centerZ);
    desiredFocusDistance = THREE.MathUtils.clamp(Math.max(frame.width * 0.9, frame.depth * 1.35, 6.2), 5.6, 12.5);
    if (cameraMode === "focus") {
      focusAnimation = 1;
    }
    return;
  }

  desiredFocusTarget.set(
    spaceFrameProfile.centerX,
    spaceFrameProfile.centerY,
    spaceFrameProfile.centerZ,
  );
  desiredFocusDistance = THREE.MathUtils.clamp(
    Math.max(
      spaceFrameProfile.width * 0.96,
      spaceFrameProfile.depth * 1.28,
      spaceFrameProfile.height * 0.72 + 3.4,
    ),
    5.2,
    15.5,
  );
  if (cameraMode === "focus") {
    focusAnimation = 1;
  }
}

function updateCameraFocus() {
  const focusDelta = desiredFocusTarget.clone().sub(controls.target);
  if (focusDelta.lengthSq() > 1e-6) {
    focusDelta.multiplyScalar(0.16);
    controls.target.add(focusDelta);
    camera.position.add(focusDelta);
  }

  const offset = camera.position.clone().sub(controls.target);
  const currentDistance = offset.length();
  if (currentDistance > 1e-6) {
    offset.setLength(THREE.MathUtils.lerp(currentDistance, desiredFocusDistance, 0.14));
    camera.position.copy(controls.target).add(offset);
  }

  focusAnimation *= 0.86;
}

function updateActivityHotspots() {
  while (activityHotspotGroup.children.length) {
    const [child] = activityHotspotGroup.children;
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
    activityHotspotGroup.remove(child);
  }

  const hotspots = computeLayerActivityHotspots(dataset.pointInstances, selectedLayer, activeCategories);
  hotspots.forEach((hotspot) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: createGlowTexture(),
        color: hotspot.color,
        transparent: true,
        opacity: hotspot.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(hotspot.x, layerToY(selectedLayer) + 0.02, hotspot.z);
    mesh.scale.set(hotspot.width, hotspot.depth, 1);
    activityHotspotGroup.add(mesh);
  });
}

function updateHeatmapScene() {
  while (heatmapSceneGroup.children.length) {
    const [child] = heatmapSceneGroup.children;
    child.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach((material) => material.dispose());
        } else {
          node.material.dispose();
        }
      }
    });
    heatmapSceneGroup.remove(child);
  }

  if (currentAppMode !== "heatmap") {
    return;
  }

  const similarityMeta = dataset.categorySimilarity;
  const byLayer = similarityMeta?.byLayer ?? similarityMeta?.by_layer;
  const layerEntry = byLayer?.[String(selectedLayer)];
  if (!layerEntry?.matrix?.length) {
    return;
  }

  const categories = similarityMeta.categories ?? CATEGORY_ORDER;
  const centroids = computeHeatmapCentroids(selectedLayer, categories);
  const diagonalValues = categories
    .map((category, index) => ({ category, value: layerEntry.matrix[index]?.[index] }))
    .filter((entry) => centroids.has(entry.category) && typeof entry.value === "number");
  const diagonalMin = diagonalValues.length ? Math.min(...diagonalValues.map((entry) => entry.value)) : 0;
  const diagonalMax = diagonalValues.length ? Math.max(...diagonalValues.map((entry) => entry.value)) : 1;

  const planeFrame = computeHeatmapFrame([...centroids.values()]);
  const plane = createLayerSlice({ layer: selectedLayer, selected: true });
  plane.group.position.set(planeFrame.centerX, layerToY(selectedLayer), planeFrame.centerZ);
  plane.group.scale.set(planeFrame.width, 1, planeFrame.depth);
  heatmapSceneGroup.add(plane.group);

  for (let rowIndex = 0; rowIndex < categories.length; rowIndex += 1) {
    const leftCategory = categories[rowIndex];
    const leftCentroid = centroids.get(leftCategory);
    if (!leftCentroid) {
      continue;
    }

    for (let colIndex = rowIndex + 1; colIndex < categories.length; colIndex += 1) {
      const rightCategory = categories[colIndex];
      const rightCentroid = centroids.get(rightCategory);
      const similarity = layerEntry.matrix[rowIndex]?.[colIndex];
      if (!rightCentroid || typeof similarity !== "number") {
        continue;
      }

      const edgeColor = similarityToColor(similarity);
      const start = new THREE.Vector3(leftCentroid.x, layerToY(selectedLayer) + 0.03, leftCentroid.z);
      const end = new THREE.Vector3(rightCentroid.x, layerToY(selectedLayer) + 0.03, rightCentroid.z);
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(edgeColor),
        transparent: true,
        opacity: THREE.MathUtils.clamp(0.2 + ((similarity + 1) / 2) * 0.65, 0.2, 0.85),
      });
      heatmapSceneGroup.add(new THREE.Line(geometry, material));

      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      midpoint.y += 0.12;
      heatmapSceneGroup.add(
        createTextSprite(similarity.toFixed(2), edgeColor, midpoint, 0.64),
      );
    }
  }

  diagonalValues.forEach(({ category, value }) => {
    const centroid = centroids.get(category);
    const normalized = normalizeScalar(value, diagonalMin, diagonalMax);
    const radius = lerp(0.58, 1.18, normalized);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: createGlowTexture(),
        color: CATEGORY_CONFIG[category].color,
        transparent: true,
        opacity: 0.32 + normalized * 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(centroid.x, layerToY(selectedLayer) + 0.02, centroid.z);
    glow.scale.set(radius * 2.4, radius * 2.4, 1);
    heatmapSceneGroup.add(glow);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(lerp(0.16, 0.28, normalized), 24, 24),
      new THREE.MeshBasicMaterial({
        color: CATEGORY_CONFIG[category].color,
        transparent: true,
        opacity: 0.96,
      }),
    );
    core.position.set(centroid.x, layerToY(selectedLayer) + 0.16, centroid.z);
    heatmapSceneGroup.add(core);

    heatmapSceneGroup.add(
      createTextSprite(
        `${categoryLabel(category)} ${value.toFixed(2)}`,
        CATEGORY_CONFIG[category].color,
        new THREE.Vector3(centroid.x, layerToY(selectedLayer) + 0.72, centroid.z),
        0.82,
      ),
    );
  });
}

function computeHeatmapCentroids(layer, categories) {
  const centroids = new Map();

  categories.forEach((category) => {
    const points = dataset.pointInstances.filter((point) => (
      point.layer === layer &&
      point.category === category &&
      activeCategories.has(point.category)
    ));
    if (!points.length) {
      return;
    }

    const bounds = dataset.latentBoundsByLayer[layer];
    const positions = points.map((point) => projectMetricPosition(point.metricPosition, layer, bounds));
    const centerX = positions.reduce((sum, position) => sum + position[0], 0) / positions.length;
    const centerZ = positions.reduce((sum, position) => sum + position[2], 0) / positions.length;
    centroids.set(category, { x: centerX, z: centerZ });
  });

  return centroids;
}

function computeHeatmapFrame(centroids) {
  if (!centroids.length) {
    return {
      centerX: VIEW_TARGET.x,
      centerZ: 0,
      width: 6.2,
      depth: 4.6,
    };
  }

  const xs = centroids.map((centroid) => centroid.x);
  const zs = centroids.map((centroid) => centroid.z);
  return {
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    centerZ: (Math.min(...zs) + Math.max(...zs)) / 2,
    width: Math.max(4.4, Math.max(...xs) - Math.min(...xs) + 2.8),
    depth: Math.max(3.6, Math.max(...zs) - Math.min(...zs) + 2.4),
  };
}

function computeLayerActivityHotspots(pointInstances, layer, enabledCategories) {
  const groups = new Map();
  const activationValues = pointInstances
    .filter((point) => point.layer === layer && enabledCategories.has(point.category))
    .map((point) => point.activationStrength);
  const minActivation = activationValues.length ? Math.min(...activationValues) : 0;
  const maxActivation = activationValues.length ? Math.max(...activationValues) : 1;

  pointInstances.forEach((point) => {
    if (point.layer !== layer || !enabledCategories.has(point.category)) {
      return;
    }

    const key = `${point.category}:${point.promptId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        category: point.category,
        promptId: point.promptId,
        promptText: point.promptText,
        color: point.color,
        points: [],
        activationSum: 0,
      });
    }

    const group = groups.get(key);
    group.points.push(point);
    group.activationSum += point.activationStrength;
  });

  return [...groups.values()]
    .filter((group) => group.points.length)
    .map((group) => {
      const positions = group.points.map((point) => getPointPosition(point));
      const centerX = positions.reduce((sum, position) => sum + position[0], 0) / positions.length;
      const centerZ = positions.reduce((sum, position) => sum + position[2], 0) / positions.length;
      const spreadX = Math.sqrt(positions.reduce((sum, position) => sum + ((position[0] - centerX) ** 2), 0) / positions.length);
      const spreadZ = Math.sqrt(positions.reduce((sum, position) => sum + ((position[2] - centerZ) ** 2), 0) / positions.length);
      const meanActivation = group.activationSum / group.points.length;

      return {
        promptId: group.promptId,
        promptText: group.promptText,
        color: group.color,
        x: centerX,
        z: centerZ,
        width: THREE.MathUtils.clamp(0.5 + spreadX * 5.2, 0.58, 1.6),
        depth: THREE.MathUtils.clamp(0.32 + spreadZ * 6.4, 0.34, 1.15),
        opacity: THREE.MathUtils.clamp(0.16 + normalizeScalar(meanActivation, minActivation, maxActivation) * 0.24, 0.16, 0.36),
      };
    });
}

function computeSpaceFrame(pointInstances, enabledCategories) {
  const visiblePoints = pointInstances.filter((point) => (!enabledCategories || enabledCategories.has(point.category)));
  if (!visiblePoints.length) {
    return {
      centerX: 5.4,
      centerY: layerToY(selectedLayer),
      centerZ: 0,
      minY: layerToY(selectedLayer),
      maxY: layerToY(selectedLayer),
      width: 1,
      height: 1,
      depth: 1,
      shapeLabel: t("shape_empty"),
    };
  }

  const positions = visiblePoints.map((point) => getPointPosition(point));
  const xs = positions.map((position) => position[0]);
  const ys = positions.map((position) => position[1]);
  const zs = positions.map((position) => position[2]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const width = Math.max(1.2, maxX - minX + 1.1);
  const height = Math.max(1, maxY - minY + 0.8);
  const depth = Math.max(1.1, maxZ - minZ + 0.7);
  const aspect = width / Math.max(depth, 0.001);

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    centerZ: (minZ + maxZ) / 2,
    minY,
    maxY,
    width,
    height,
    depth,
    shapeLabel: aspect > 3 ? t("shape_wide_rect") : aspect > 1.5 ? t("shape_round_rect") : t("shape_roundish"),
  };
}

function parseLayerSelection(rawValue) {
  const trimmed = `${rawValue ?? ""}`.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.toLowerCase() === "all") {
    return [...allLayers];
  }

  const resolvedLayers = [];
  const segments = trimmed.split(",");
  segments.forEach((segment) => {
    const part = segment.trim();
    if (!part) {
      return;
    }

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      const low = Math.max(layerMin, Math.min(start, end));
      const high = Math.min(layerMax, Math.max(start, end));
      for (let layer = low; layer <= high; layer += 1) {
        resolvedLayers.push(layer);
      }
      return;
    }

    const value = Number(part);
    if (Number.isInteger(value) && value >= layerMin && value <= layerMax) {
      resolvedLayers.push(value);
    }
  });

  return normalizeLayerList(resolvedLayers);
}

function normalizeLayerList(layers) {
  return [...new Set(layers.filter((layer) => Number.isInteger(layer) && layer >= layerMin && layer <= layerMax))]
    .sort((left, right) => left - right);
}

function formatLayerSelectionString(layers) {
  const normalized = normalizeLayerList(layers);
  if (!normalized.length) {
    return `${selectedLayer}`;
  }

  const ranges = [];
  let start = normalized[0];
  let previous = normalized[0];

  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  return ranges.join(", ");
}

function computeRadiusEdges(pointsAtLayer, threshold) {
  if (!pointsAtLayer.length) {
    return [];
  }

  const positions = pointsAtLayer.map((point) => getPointPosition(point));
  const tree = buildBallTree(positions, positions.map((_, index) => index));
  const edges = [];

  positions.forEach((position, index) => {
    const neighbors = [];
    radiusSearch(tree, position, threshold, neighbors);

    for (const candidate of neighbors) {
      if (candidate <= index) {
        continue;
      }
      if (distance(position, positions[candidate]) <= threshold) {
        edges.push({
          a: pointsAtLayer[index],
          b: pointsAtLayer[candidate],
        });
      }
    }
  });

  return edges;
}

function buildBallTree(points, indices) {
  if (!indices.length) {
    return null;
  }

  const center = [0, 0, 0];
  indices.forEach((index) => {
    center[0] += points[index][0];
    center[1] += points[index][1];
    center[2] += points[index][2];
  });
  center[0] /= indices.length;
  center[1] /= indices.length;
  center[2] /= indices.length;

  let radius = 0;
  indices.forEach((index) => {
    radius = Math.max(radius, distance(center, points[index]));
  });

  if (indices.length <= 10) {
    return { center, radius, indices, left: null, right: null };
  }

  let splitAxis = 0;
  let widestSpread = -Infinity;
  for (let axis = 0; axis < 3; axis += 1) {
    let min = Infinity;
    let max = -Infinity;
    indices.forEach((index) => {
      min = Math.min(min, points[index][axis]);
      max = Math.max(max, points[index][axis]);
    });
    if (max - min > widestSpread) {
      widestSpread = max - min;
      splitAxis = axis;
    }
  }

  const ordered = [...indices].sort((a, b) => points[a][splitAxis] - points[b][splitAxis]);
  const midpoint = Math.floor(ordered.length / 2);

  return {
    center,
    radius,
    indices: null,
    left: buildBallTree(points, ordered.slice(0, midpoint)),
    right: buildBallTree(points, ordered.slice(midpoint)),
  };
}

function radiusSearch(node, queryPoint, threshold, results) {
  if (!node) {
    return;
  }

  if (distance(node.center, queryPoint) - node.radius > threshold) {
    return;
  }

  if (node.indices) {
    node.indices.forEach((index) => results.push(index));
    return;
  }

  radiusSearch(node.left, queryPoint, threshold, results);
  radiusSearch(node.right, queryPoint, threshold, results);
}

function layerToY(layer) {
  return lerp(-6.3, 6.3, (layer - dataLayerMin) / Math.max(dataLayerMax - dataLayerMin, 1));
}

async function loadDataset() {
  const requestedSource = currentProjectionSource;
  const candidates = requestedSource === "umap"
    ? [DATASET_FILE_BY_PROJECTION.umap, DATASET_FILE_BY_PROJECTION.pca]
    : [DATASET_FILE_BY_PROJECTION.pca];

  try {
    for (const path of candidates) {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const exported = await response.json();
      if (exported.format !== "embedding_visualizer_export_v1") {
        throw new Error("Unsupported hidden state export format");
      }

      const projectionMethod = exported.metadata?.projection_method ?? "pca";
      currentProjectionSource = projectionMethod === "umap" ? "umap" : "pca";
      localStorage.setItem("llm-space-projection-source", currentProjectionSource);
      return buildDatasetFromExport(exported);
    }
    throw new Error(`No export file could be loaded for projection source '${requestedSource}'`);
  } catch (error) {
    console.warn("Falling back to mock dataset:", error);
    currentProjectionSource = "pca";
    const rng = createRng(20260411);
    return buildMockDataset(rng);
  }
}

function buildDatasetFromExport(exported) {
  const sampledLayers = [...(exported.metadata.sampled_decoder_layers ?? [])]
    .map((value) => Number(value))
    .sort((a, b) => a - b);
  const promptSlots = createPromptSlotLookup(exported.tokens.map((token) => ({
    category: token.category,
    promptId: token.prompt_id,
    promptText: token.prompt_text,
  })));
  const denseLayerMin = sampledLayers[0];
  const denseLayerMax = exported.metadata.decoder_layer_max ?? sampledLayers[sampledLayers.length - 1];
  dataLayerMin = denseLayerMin;
  dataLayerMax = denseLayerMax;

  const tokens = exported.tokens.map((token) => {
    const sampledEntries = sampledLayers.map((layer) => {
      const entry = token.layers[String(layer)];
      return {
        layer,
        metricPosition: entry.pca,
        svd: entry.svd,
        attention: entry.attention,
        activationStrength: entry.activation_strength ?? deriveActivationStrength(entry),
      };
    });

    const denseLayers = Array.from({ length: denseLayerMax + 1 }, (_, layer) => {
      const interpolated = interpolateLayerEntry(sampledEntries, layer);
      return {
        layer,
        metricPosition: interpolated.metricPosition,
        svd: interpolated.svd,
        attention: interpolated.attention,
        activationStrength: interpolated.activationStrength,
        renderPosition: layoutPositionForToken(token, layer, interpolated.activationStrength, promptSlots),
      };
    });

    return {
      id: token.id,
      text: token.text,
      category: token.category,
      position: token.position,
      tokenId: token.token_id,
      promptText: token.prompt_text,
      promptId: token.prompt_id,
      layers: denseLayers,
    };
  });

  return {
    tokens,
    layerMin: denseLayerMin,
    layerMax: denseLayerMax,
    varianceText: exported.metadata.variance_text,
    categorySimilarity: normalizeCategorySimilarityMetadata(exported.metadata.category_similarity ?? null),
    projectionMethod: exported.metadata?.projection_method ?? "pca",
    sourceLabel: exported.metadata.model_name
      ? `Gercek veri: ${exported.metadata.model_name} / ${(exported.metadata?.projection_method ?? "pca").toUpperCase()}`
      : `Gercek veri / ${(exported.metadata?.projection_method ?? "pca").toUpperCase()}`,
  };
}

function normalizeCategorySimilarityMetadata(metadata) {
  if (!metadata) {
    return null;
  }

  return {
    ...metadata,
    byLayer: metadata.byLayer ?? metadata.by_layer ?? {},
  };
}

function interpolateLayerEntry(entries, targetLayer) {
  if (targetLayer <= entries[0].layer) {
    return cloneLayerEntry(entries[0]);
  }
  if (targetLayer >= entries[entries.length - 1].layer) {
    return cloneLayerEntry(entries[entries.length - 1]);
  }

  for (let index = 0; index < entries.length - 1; index += 1) {
    const left = entries[index];
    const right = entries[index + 1];
    if (targetLayer < left.layer || targetLayer > right.layer) {
      continue;
    }
    if (targetLayer === left.layer) {
      return cloneLayerEntry(left);
    }
    if (targetLayer === right.layer) {
      return cloneLayerEntry(right);
    }

    const t = (targetLayer - left.layer) / (right.layer - left.layer);
    return {
      metricPosition: [
        lerp(left.metricPosition[0], right.metricPosition[0], t),
        lerp(left.metricPosition[1], right.metricPosition[1], t),
        lerp(left.metricPosition[2], right.metricPosition[2], t),
      ],
      svd: t < 0.5 ? left.svd.map((item) => ({ ...item })) : right.svd.map((item) => ({ ...item })),
      attention: t < 0.5 ? cloneAttention(left.attention) : cloneAttention(right.attention),
      activationStrength: lerp(left.activationStrength, right.activationStrength, t),
    };
  }

  return cloneLayerEntry(entries[entries.length - 1]);
}

function cloneLayerEntry(entry) {
  return {
    metricPosition: [...entry.metricPosition],
    svd: entry.svd.map((component) => ({ ...component })),
    attention: cloneAttention(entry.attention),
    activationStrength: entry.activationStrength,
  };
}

function cloneAttention(attention) {
  if (!attention) {
    return null;
  }
  return {
    scoreMean: attention.scoreMean,
    scoreMin: attention.scoreMin,
    scoreMax: attention.scoreMax,
    topKeys: attention.topKeys.map((item) => ({ ...item })),
  };
}

function buildMockDataset(random) {
  dataLayerMin = DEFAULT_LAYER_MIN;
  dataLayerMax = DEFAULT_LAYER_MAX;
  const tokens = [];
  const categoryCentroids = {
    math: [2.4, 1.5, -0.7, 1.4, 0.2, 1.1, -0.6, 0.5, 1.1, -0.4, 0.8, 0.2],
    language: [-1.2, 2.2, 1.3, -0.3, 1.4, -0.2, 0.8, 1.1, -0.6, 0.5, 0.2, 0.9],
    code: [0.9, -1.7, 2.3, 1.1, -0.9, 0.3, 1.4, -0.8, 0.4, 1.3, -0.2, 0.7],
    logic: [1.6, 0.9, 1.7, 0.4, 0.8, 0.6, 1.2, 0.1, 0.5, 1.0, 0.7, 0.4],
  };
  const svdBasis = generateOrthonormalBasis(random, SVD_COMPONENTS, HIDDEN_DIMS);
  const allVectors = [];

  Object.entries({ ...TOKEN_SETS, logic: ["if", "then", "therefore", "implies", "valid", "false", "true", "proof"] })
    .forEach(([category, words]) => {
      words.forEach((word, tokenIndex) => {
        const tokenBias = createVector(HIDDEN_DIMS, () => random() * 1.5 - 0.75);
        const token = {
          text: word,
          category,
          position: tokenIndex,
          promptText: "Mock prompt stream",
          promptId: `mock-${category}`,
          layers: [],
        };

        for (let layer = 0; layer < DEFAULT_LAYER_COUNT; layer += 1) {
          const t = layer / (DEFAULT_LAYER_COUNT - 1);
          const hidden = createVector(HIDDEN_DIMS, (dim) => (
            categoryCentroids[category][dim] +
            tokenBias[dim] * 0.9 +
            Math.sin((layer + 1) * 0.15 + dim * 0.4 + tokenIndex * 0.2) * 0.5 +
            (t - 0.5) * 1.1
          ));

          token.layers.push({
            layer,
            metricPosition: [0, 0, 0],
            svd: svdBasis
              .map((basis, componentIndex) => ({
                name: `SVD-${componentIndex + 1}`,
                value: dot(hidden, basis),
              }))
              .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
              .slice(0, 3),
            attention: null,
            activationStrength: Math.sqrt(hidden.reduce((sum, value) => sum + value * value, 0)),
            hidden,
          });

          allVectors.push(hidden);
        }

        tokens.push(token);
      });
    });

  const pca = computePca(allVectors, PCA_COMPONENTS);
  const promptSlots = createPromptSlotLookup(tokens);
  let observationIndex = 0;
  tokens.forEach((token) => {
    token.layers.forEach((layerEntry) => {
      layerEntry.metricPosition = pca.projected[observationIndex];
      layerEntry.renderPosition = layoutPositionForToken(token, layerEntry.layer, layerEntry.activationStrength, promptSlots);
      observationIndex += 1;
      delete layerEntry.hidden;
    });
  });

  return {
    tokens,
    layerMin: DEFAULT_LAYER_MIN,
    layerMax: DEFAULT_LAYER_MAX,
    varianceText: `${(pca.varianceRatio[0] * 100).toFixed(1)}% / ${(pca.varianceRatio[1] * 100).toFixed(1)}% / ${(pca.varianceRatio[2] * 100).toFixed(1)}%`,
    categorySimilarity: null,
    sourceLabel: "Sahte veri",
  };
}

function computePca(observations, componentCount) {
  const mean = Array(HIDDEN_DIMS).fill(0);
  observations.forEach((vector) => {
    for (let dim = 0; dim < HIDDEN_DIMS; dim += 1) {
      mean[dim] += vector[dim];
    }
  });
  for (let dim = 0; dim < HIDDEN_DIMS; dim += 1) {
    mean[dim] /= observations.length;
  }

  const centered = observations.map((vector) => vector.map((value, dim) => value - mean[dim]));
  const covariance = Array.from({ length: HIDDEN_DIMS }, () => Array(HIDDEN_DIMS).fill(0));

  centered.forEach((vector) => {
    for (let row = 0; row < HIDDEN_DIMS; row += 1) {
      for (let col = row; col < HIDDEN_DIMS; col += 1) {
        covariance[row][col] += vector[row] * vector[col];
      }
    }
  });

  const normalizer = 1 / Math.max(centered.length - 1, 1);
  for (let row = 0; row < HIDDEN_DIMS; row += 1) {
    for (let col = row; col < HIDDEN_DIMS; col += 1) {
      covariance[row][col] *= normalizer;
      covariance[col][row] = covariance[row][col];
    }
  }

  const trace = covariance.reduce((sum, row, index) => sum + row[index], 0);
  const matrix = covariance.map((row) => [...row]);
  const eigenvectors = [];
  const eigenvalues = [];

  for (let component = 0; component < componentCount; component += 1) {
    const vector = powerIteration(matrix);
    const eigenvalue = dot(vector, multiplyMatrixVector(matrix, vector));
    eigenvectors.push(vector);
    eigenvalues.push(eigenvalue);

    for (let row = 0; row < HIDDEN_DIMS; row += 1) {
      for (let col = 0; col < HIDDEN_DIMS; col += 1) {
        matrix[row][col] -= eigenvalue * vector[row] * vector[col];
      }
    }
  }

  return {
    projected: centered.map((vector) => eigenvectors.map((axis) => dot(vector, axis))),
    varianceRatio: eigenvalues.map((value) => value / trace),
  };
}

function powerIteration(matrix) {
  let vector = normalize(createVector(HIDDEN_DIMS, () => Math.random() * 2 - 1));
  for (let iteration = 0; iteration < 48; iteration += 1) {
    vector = normalize(multiplyMatrixVector(matrix, vector));
  }
  return vector;
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => dot(row, vector));
}

function generateOrthonormalBasis(random, count, dims) {
  const basis = [];
  while (basis.length < count) {
    let vector = createVector(dims, () => random() * 2 - 1);
    basis.forEach((existing) => {
      const projection = dot(vector, existing);
      for (let i = 0; i < dims; i += 1) {
        vector[i] -= projection * existing[i];
      }
    });
    const normalized = normalize(vector);
    if (length(normalized) > 0.0001) {
      basis.push(normalized);
    }
  }
  return basis;
}

function createPromptSlotLookup(items) {
  const perCategory = new Map();
  items.forEach((item) => {
    const category = item.category ?? "language";
    const promptId = item.promptId ?? item.prompt_id ?? `${category}-default`;
    const promptText = item.promptText ?? item.prompt_text ?? promptId;
    if (!perCategory.has(category)) {
      perCategory.set(category, []);
    }
    const bucket = perCategory.get(category);
    if (!bucket.some((entry) => entry.promptId === promptId)) {
      bucket.push({ promptId, promptText });
    }
  });

  const lookup = new Map();
  perCategory.forEach((bucket, category) => {
    const count = bucket.length;
    bucket.forEach((entry, index) => {
      const bandCenter = count === 1 ? 0 : lerp(-1.05, 1.05, index / (count - 1));
      lookup.set(entry.promptId, {
        category,
        promptText: entry.promptText,
        bandCenter,
        bandIndex: index,
        bandCount: count,
      });
    });
  });
  return lookup;
}

function layoutPositionForToken(token, layer, activationStrength, promptSlots = null) {
  const baseX = CATEGORY_X[token.category] ?? CATEGORY_X.language;
  const tokenHash = hashString(`${token.promptId}:${token.position}:${token.text}`);
  const promptSlot = promptSlots?.get(token.promptId) ?? { bandCenter: 0 };
  const xJitter = ((tokenHash % 1000) / 1000 - 0.5) * 0.46;
  const zJitter = ((((tokenHash * 17) % 1000) / 1000) - 0.5) * 0.18;
  const activationLift = normalizeScalar(activationStrength, 0, 80) * 0.03;
  return [
    baseX + xJitter,
    layerToY(layer),
    promptSlot.bandCenter + zJitter + activationLift,
  ];
}

function deriveActivationStrength(entry) {
  if (entry.activation_strength != null) {
    return Number(entry.activation_strength);
  }
  const values = (entry.svd ?? []).map((component) => Number(component.value));
  if (!values.length) {
    return 0;
  }
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createVector(size, factory) {
  return Array.from({ length: size }, (_, index) => factory(index));
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function length(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const vectorLength = length(vector);
  if (vectorLength < 1e-8) {
    return vector.map(() => 0);
  }
  return vector.map((value) => value / vectorLength);
}

function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalizeScalar(value, minValue, maxValue) {
  if (Math.abs(maxValue - minValue) < 1e-6) {
    return 0.5;
  }
  return THREE.MathUtils.clamp((value - minValue) / (maxValue - minValue), 0, 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function formatSigned(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatTokenForDisplay(value) {
  const text = String(value ?? "");
  const normalized = text
    .replaceAll("Ä ", "Ġ")
    .replaceAll("Ğ", "Ġ");

  if (normalized.startsWith("Ġ")) {
    return `␠${normalized.slice(1)}`;
  }

  return normalized;
}
