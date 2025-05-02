import tensorflow as tf
from utils.dataset_loader import load_dataset

# Paths
IMAGE_DIR = r"C:\Users\parad\Downloads\webar-measurement-tool\dataset\train"
ANNOT_DIR = r"C:\Users\parad\Downloads\webar-measurement-tool\dataset\annotations"
CLASS_MAP = {"Radiator": 0}

# Load dataset
train_ds = load_dataset(IMAGE_DIR, ANNOT_DIR, CLASS_MAP)

# Define base model
base = tf.keras.applications.MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base.trainable = False

# Build custom head
x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
bbox_output = tf.keras.layers.Dense(4, activation='sigmoid', name='bbox')(x)
label_output = tf.keras.layers.Dense(len(CLASS_MAP), activation='softmax', name='label')(x)  # <-- was missing (x)

# Assemble model
model = tf.keras.Model(inputs=base.input, outputs={'bbox': bbox_output, 'label': label_output})

# Compile model
model.compile(
    optimizer='adam',
    loss={'bbox': 'mse', 'label': 'sparse_categorical_crossentropy'},
    metrics={'bbox': 'mae', 'label': 'accuracy'}
)

# Train model
model.fit(train_ds, epochs=20)

# Save model
model.save("radiator_model_tf")
