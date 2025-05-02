import xml.etree.ElementTree as ET

def parse_voc(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    filename = root.find('filename').text
    size = root.find('size')
    width = int(size.find('width').text)
    height = int(size.find('height').text)

    objs = []
    for obj in root.findall('object'):
        name = obj.find('name').text
        bndbox = obj.find('bndbox')
        xmin = int(bndbox.find('xmin').text) / width
        ymin = int(bndbox.find('ymin').text) / height
        xmax = int(bndbox.find('xmax').text) / width
        ymax = int(bndbox.find('ymax').text) / height
        objs.append((name, [xmin, ymin, xmax, ymax]))

    return filename, objs
