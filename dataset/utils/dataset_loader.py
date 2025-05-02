import os
import tensorflow as tf
from utils.voc_parser import parse_voc

def load_dataset(image_dir, annot_dir, class_map, image_size=(224, 224)):
    image_paths = []
    boxes = []
    labels = []

    for xml_file in os.listdir(annot_dir):
        if not xml_file.endswith(".xml"):
            continue
        filepath = os.path.join(annot_dir, xml_file)
        filename, obj_data = parse_voc(filepath)
        image_path = os.path.join(image_dir, filename)

        for label, box in obj_data:
            image_paths.append(image_path)
            boxes.append(box)
            labels.append(class_map[label])

    def load_image(path, box, label):
        image = tf.io.read_file(path)
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.resize(image, image_size)
        return image, {'bbox': box, 'label': label}

    ds = tf.data.Dataset.from_tensor_slices((image_paths, boxes, labels))
    ds = ds.map(lambda path, box, label: load_image(path, box, label))
    return ds.batch(16).shuffle(100)
