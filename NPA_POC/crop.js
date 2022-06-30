// based on https://codelabs.developers.google.com/codelabs/tensorflowjs-object-detection

const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
const demosSection = document.getElementById("demos");
const enableWebcamButton = document.getElementById("webcamButton");

const result = document.getElementById('result')

// Check if webcam access is supported.
  console.log(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will
// define in the next step.
if (getUserMediaSupported()) {
  console.log("enableCam+++++++++")
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  // Only continue if the COCO-SSD has finished loading.
  console.log("model>>>>>>>>>>>>>>", model)
  if (!model) {
    return;
  }

  // Hide the button once clicked.
  event.target.classList.add("removed");

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    console.log("STREAM DATA");
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

// Store the resulting model in the global scope of our app.
var model = undefined;

tflite.ObjectDetector.create(
  "model.tflite"
).then((loadedModel) => {
  console.log("<<<<<<<<<<<<modelLoaded>>>>>>>>>>>>>>", loadedModel)
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove("invisible");
});

var children = [];

function predictWebcam() {
  const predictions = model.detect(video);

  // Remove any highlighting we did previous frame.
  for (let i = 0; i < children.length; i++) {
    liveView.removeChild(children[i]);
  }
  children.splice(0);

  // Now lets loop through predictions and draw them to the live view if
  // they have a high confidence score.
  // console.log("predictions" , predictions.length);
  for (let i = 0; i < predictions.length; i++) {
    const curObject = predictions[i];
    // console.log("curObject" , curObject);
    if (curObject.classes[0].probability > 0.9) {
      // console.log("CURRENT OBJ", curObject.boundingBox);
      const p = document.createElement("p");
      p.innerText =
        curObject.classes[0].className +
        " - with " +
        Math.round(parseFloat(curObject.classes[0].probability) * 100) +
        "% confidence.";
      p.style =
        "margin-left: " +
        curObject.boundingBox.originX +
        "px; margin-top: " +
        (curObject.boundingBox.originY - 10) +
        "px; width: " +
        (curObject.boundingBox.width - 10) +
        "px; top: 0; left: 0;";

      const highlighter = document.createElement("div");
      highlighter.setAttribute("class", "highlighter");
      highlighter.style =
        "left: " +
        curObject.boundingBox.originX +
        "px; top: " +
        curObject.boundingBox.originY +
        "px; width: " +
        curObject.boundingBox.width +
        "px; height: " +
        curObject.boundingBox.height +
        "px;";

      liveView.appendChild(highlighter);
      liveView.appendChild(p);
      children.push(highlighter);
      children.push(p);
      capture(curObject)
    }
  }
  // Call this function again to keep predicting when the browser is ready.
  window.requestAnimationFrame(predictWebcam);
}

function capture(obj) {

  let canvas = document.querySelector("#canvas");
  // CROP highlighter[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]
      canvas.getContext('2d').drawImage(video, obj.boundingBox.originX, obj.boundingBox.originY, obj.boundingBox.width, obj.boundingBox.height, 0, 0, canvas.width, canvas.height);
      let image_data_url = canvas.toDataURL('image/jpeg');
      // data url of the image
      console.log("cropped image",image_data_url);

// Morphological Transformation-------Image_processing_applied_for_OCR-------

      let src = cv.imread('canvas');
      cv.cvtColor(src, src, cv.COLOR_RGBA2RGB);
      let dst = new cv.Mat();

// above 3 common to initiate all morphological transformation=== 

// Black Hat----------------------

      // let M = cv.Mat.ones(53, 53, cv.CV_8U);
      // cv.morphologyEx(src, dst, cv.MORPH_BLACKHAT, M);

// Top Hat---------------------

      // let M = cv.Mat.ones(9, 9, cv.CV_8U);
      // cv.morphologyEx(src, dst, cv.MORPH_TOPHAT, M);
      
// Structuring Element-----------------

      let M = new cv.Mat();
      let ksize = new cv.Size(5, 5);
      M = cv.getStructuringElement(cv.MORPH_CROSS, ksize);
      cv.morphologyEx(src, dst, cv.MORPH_GRADIENT, M);

// Gray scale------------------

      // You can try more different parameters
      // cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
      

// bellow 2 common to end morphological transformation=== 

      cv.imshow('canvasOutput', dst);
      let proceed_image = canvasOutput.toDataURL('image/jpeg');


// ~~~~~~~~~~~~~~~~~~~~OCR~~~~~~~~~~~~~~~~~~~~~~
      
      Tesseract.recognize(proceed_image, 'eng') 
        .then(({ data: { text } }) => {
        result.value = text
      })

      src.delete(); dst.delete(); M.delete();
      //for gray scale
      // src.delete(); dst.delete();

      callAPI(image_data_url)
};

function callAPI(b64Data) {

const byteCharacters = atob(b64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''));
const byteNumbers = new Array(byteCharacters.length);
for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
}
const byteArray = new Uint8Array(byteNumbers);
const blob = new Blob([byteArray], {type: 'image/jpeg'});
const file = new File([blob], `crop_${new Date().getTime()}`);
  let formData = new FormData()
  formData.append('file', file)

  fetch("http://192.168.1.49:8011/input_image",
    {
      body: formData,
      method: "post"
    });
}