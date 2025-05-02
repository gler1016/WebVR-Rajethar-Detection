import os
import glob
import pandas as pd
import tensorflow as tf
import xml.etree.ElementTree as ET
from object_detection.utils import dataset_util

# Update your label map as needed
LABEL_MAP = {'radiator': 1}

def xml_to_csv(path):
    xml_list = []
    for xml_file in glob.glob(os.path.join(path, '*.xml')):
        tree = ET.parse(xml_file)
        root = tree.getroot()
        filename = root.find('filename').text
        width = int(root.find('size/width').text)
        height = int(root.find('size/height').text)
        for member in root.findall('object'):
            value = (
                filename,
                width,
                height,
                member.find('name').text,
                int(member.find('bndbox/xmin').text),
                int(member.find('bndbox/ymin').text),
                int(member.find('bndbox/xmax').text),
                int(member.find('bndbox/ymax').text),
            )
            xml_list.append(value)
    column_name = ['filename', 'width', 'height', 'class', 'xmin', 'ymin', 'xmax', 'ymax']
    return pd.DataFrame(xml_list, columns=column_name)

def create_tf_example(group, image_dir):
    image_path = os.path.join(image_dir, group.filename.iloc[0])
    try:
        with tf.io.gfile.GFile(image_path, 'rb') as fid:
            encoded_image_data = fid.read()
    except Exception as e:
        print(f"[Error] Failed to load image {image_path}: {e}")
        return None

    image_format = group.filename.iloc[0].split('.')[-1].encode('utf8')
    width = int(group.width.iloc[0])
    height = int(group.height.iloc[0])
    filename = group.filename.iloc[0].encode('utf8')

    xmins, xmaxs, ymins, ymaxs, classes_text, classes = [], [], [], [], [], []

    for _, row in group.iterrows():
        xmins.append(row['xmin'] / width)
        xmaxs.append(row['xmax'] / width)
        ymins.append(row['ymin'] / height)
        ymaxs.append(row['ymax'] / height)
        classes_text.append(row['class'].encode('utf8'))
        classes.append(LABEL_MAP.get(row['class'], 0))

    tf_example = tf.train.Example(features=tf.train.Features(feature={
        'image/height': dataset_util.int64_feature(height),
        'image/width': dataset_util.int64_feature(width),
        'image/filename': dataset_util.bytes_feature(filename),
        'image/source_id': dataset_util.bytes_feature(filename),
        'image/encoded': dataset_util.bytes_feature(encoded_image_data),
        'image/format': dataset_util.bytes_feature(image_format),
        'image/object/bbox/xmin': dataset_util.float_list_feature(xmins),
        'image/object/bbox/xmax': dataset_util.float_list_feature(xmaxs),
        'image/object/bbox/ymin': dataset_util.float_list_feature(ymins),
        'image/object/bbox/ymax': dataset_util.float_list_feature(ymaxs),
        'image/object/class/text': dataset_util.bytes_list_feature(classes_text),
        'image/object/class/label': dataset_util.int64_list_feature(classes),
    }))
    return tf_example

def main():
    for split in ['train', 'val']:
        output_path = rf'C:\Users\parad\Downloads\webar-measurement-tool\dataset\{split}.record'
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        xml_path = rf'C:\Users\parad\Downloads\webar-measurement-tool\dataset\annotations\{split}'
        image_path = rf'C:\Users\parad\Downloads\webar-measurement-tool\dataset\train'
 
        writer = tf.io.TFRecordWriter(output_path)
        examples = xml_to_csv(xml_path)
        grouped = examples.groupby('filename')

        for _, group in grouped:
            tf_example = create_tf_example(group, image_path)
            if tf_example:
                writer.write(tf_example.SerializeToString())

        writer.close()
        print(f'[Success] Created TFRecord for {split} at {output_path}')

if __name__ == '__main__':
    main()
