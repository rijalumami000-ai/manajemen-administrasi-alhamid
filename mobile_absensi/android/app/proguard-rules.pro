# Proguard rules for Alhamid Saff Connect
# Suppress warnings from tensorflow/google-mlkit transitive dependencies

-dontwarn org.tensorflow.lite.gpu.GpuDelegateFactory$Options$GpuBackend
-dontwarn org.tensorflow.lite.gpu.GpuDelegateFactory$Options
