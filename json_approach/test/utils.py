import pickle
import requests
import json
import os
from pathlib import Path
import psutil
import subprocess
import shutil
import re
import time
from datetime import datetime
import pytz

Features = dict
Print = None
FileWrite = None
# dump

import cv2
import os

def log(message, remote=True):
    """
    Prints the message locally and POSTs it to the log endpoint.
    """
    # ANSI escape sequence for blue text and reset.
    blue_message = f"\033[94m{message}\033[0m"
    print(blue_message)

    if remote:
        url = "http://54.167.31.12:1337/logs"
    else:
        url = "http://localhost:1337/logs"
    try:
        # URL for your logging endpoint; adjust port/hostname as needed
        # Build the payload JSON
        payload = {"logs": message}
        # POST the message as JSON to the log endpoint
        response = requests.post(url, json=payload, verify=False)
        if response.status_code != 200:
            print("Error posting log:", response.text)
    except Exception as e:
        print("Failed to post log:", e)

def path(p):
  """
  Example:
    # Define a base directory
    base_dir = Path("/home/user")

    # Build a nested directory path using the / operator
    project_dir = base_dir / "Documents" / "Projects" / "MyProject"
  
  Notes:
    * The base_dir MUST be a path, i.e. this is invalid:
      project_dir = "/home/user" / Path("Documents") / "Projects" / "MyProject"
  """
  return Path(p)

def ts():
  local_tz = pytz.timezone('America/New_York')
  return datetime.now(local_tz).strftime("%m_%d_%Y_%H_%M_%S")

def save_image(img, path):
  cv2.imwrite(path, img) # correctly formats depending on ext provided

def get_frame(video_path, timestamp: float, save_path=None):
    """
    Retrieves a single frame from a video at the specified timestamp.

    Parameters:
      video_path (str): Path to the video file.
      timestamp (float): Timestamp in seconds at which to extract the frame.

    Returns:
      numpy.ndarray or None: The frame at the specified timestamp, or None if the frame cannot be read.
    """
    cap = cv2.VideoCapture(video_path)  # Open the video file
    # Set the position in the video (in milliseconds)
    cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
    ret, frame = cap.read()  # Read the frame at the given timestamp
    if save_path:
      save_image(frame, save_path)
    cap.release()  # Release the video capture object
    return frame if ret else None

def reframe(frame, x, y, width, height):
    """
    Extracts a region of interest from an image.

    Parameters:
      frame: The input image (numpy array).
      x, y: The top-left corner coordinates of the region.
      width, height: The width and height of the region.

    Returns:
      The ROI as: img[y:y+height, x:x+width]
    """
    return frame[y:y+height, x:x+width]

def draw_rect(img, x1, y1, width, height, color=(0, 255, 0), thickness=2, save_path=None):
    """
    Draws a rectangle on the image 'img' using the top-left corner (x1, y1)
    and the given width and height.

    Parameters:
      img: The image (numpy array).
      x1, y1: Coordinates of the top-left corner of the rectangle.
      width: The width of the rectangle.
      height: The height of the rectangle.
      color: The rectangle color in BGR (default green).
      thickness: The thickness of the rectangle border.

    Returns:
      The image with the rectangle drawn.
    """
    # Calculate bottom-right corner
    x2 = x1 + width
    y2 = y1 + height
    cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)
    if save_path:
       cv2.imwrite(save_path ,img)
    return img

def get_fps(video_path):
  """
  Get the frames per second (FPS) of a video.

  Args:
      video_path (str): Path to the video file.

  Returns:
      float: FPS of the video.
  """
  cap = cv2.VideoCapture(video_path)  # Open video capture
  fps = cap.get(cv2.CAP_PROP_FPS)  # Retrieve the FPS
  cap.release()  # Release the video capture object
  return fps

def get_frames(video_path, timestamps=None, yield_timestamps=False):
    """
    Generator to yield frames from a video.
    
    Args:
        video_path (str): Path to the video file.
        timestamps (list of float, optional): Do not go over the whole video, just get the frames for the timestamps (in seconds).
            If provided, yields a tuple (timestamp, numpy.ndarray) for each timestamp.
            Otherwise, yields all frames sequentially.
        yield_timestamps (bool, optional): If True and timestamps is None,
            calculates and yields the timestamp (using FPS and frame index) along with the frame.
    
    Yields:
        If timestamps is provided or yield_timestamps is True:
            (timestamp, numpy.ndarray) tuples.
        Otherwise:
            numpy.ndarray frames.
    """
    cap = cv2.VideoCapture(video_path)

    # Check if the video was opened successfully
    if not cap.isOpened():
        raise ValueError(f"Error: Cannot open video at path '{video_path}'")
    
    if timestamps is None:
        # DO go through the whole video
        if yield_timestamps:
            # yield timestamps
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_index = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                timestamp = frame_index / fps  # Calculate timestamp from frame index and fps
                yield timestamp, frame
                frame_index += 1
        else:
            # do not yield timestamps (simpler interface)
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                yield frame
    else:
        # DO NOT go through the whole video, only the provided timestamps
        for t in sorted(timestamps):
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ret, frame = cap.read()
            if ret:
                yield t, frame
            else:
                print(f"Warning: Could not retrieve frame at {t} seconds.")
    
    cap.release()

def seconds_to_clock(seconds):
  # Convert seconds to HH:MM:SS format
  hours = seconds // 3600
  minutes = (seconds % 3600) // 60
  seconds = seconds % 60
  return f"{hours:02}:{minutes:02}:{seconds:02}"

def ffprobe(video_file, output_file=""):
  ffprobe_command = [
      'ffprobe', '-v', 'error', '-show_streams', '-show_format', video_file
  ]
  result = subprocess.run(ffprobe_command, capture_output=True, text=True)

  # Prepare to filter ffprobe output
  filtered_lines = []
  for line in result.stdout.split('\n'):
      if 'codec_name=' in line or 'width=' in line or 'height=' in line:
          filtered_lines.append(line)
  filtered_lines = '\n'.join(filtered_lines)
  if output_file:
     w(filtered_lines, output_file)
  print(filtered_lines)

# this is wrong
def benchmark(f):
  start_time = time.time()
  #f()
  end_time = time.time()
  execution_time = end_time - start_time
  print("Execution time:", execution_time)

def parent_paths_glob(file_paths):
  """
  add all the parent paths to a set
  """
  s = set()
  for file_path in file_paths:
    s.add(d(file_path))
  return s

def d(path):
  return os.path.dirname(path)

def move_files(source_dir, target_dir):
    """
    Moves all files from source_dir to target_dir.

    Parameters:
    - source_dir: The directory to move files from.
    - target_dir: The directory to move files to.
    """
    # Ensure the target directory exists
    os.makedirs(target_dir, exist_ok=True)

    # Move each file from source_dir to target_dir
    for filename in os.listdir(source_dir):
        source_path = os.path.join(source_dir, filename)
        target_path = os.path.join(target_dir, filename)
        
        # Only move files; skip directories
        if os.path.isfile(source_path):
            print(f"Moving {filename} to {target_dir}...")
            shutil.move(source_path, target_path)

def opj(*args):
    # os.path.join rules:
    # - Joins multiple paths or filenames into a single path.
    # - Leading slashes in any component (except the first) discard previous parts.
    # - Trailing slashes are preserved.
    # - Use to join directories and filenames in a platform-independent way.
    return os.path.join(*args)

def opjs(paths, name_to_join):
  # i.e. opjs(['/a/b/c', '/a/b/d'], 'transcriptions')
  # returns ['/a/b/c/transcriptions', '/a/b/d/transcriptions']
  full_paths = []
  for path in paths:
      full_path = opj(path, name_to_join)
      full_paths.append(full_path)
  return full_paths

def m(f, arr):
  # map with a simpler interface, but less powerful because it cannot access each element, which might be desired with something like a dict, i.e. x[key]

  # also can't be called with multiple arguments...
  return list(map(lambda x: f(x), arr))

def ld(path):
  return os.listdir(path)

def ldp(path):
  files = os.listdir(path) 
  paths = [opj(path, file) for file in files]
  return paths

def flatten(nested_list):
  flattened_list = [item for sublist in nested_list for item in sublist]
  return(flattened_list)


def flatten_into(a,b):
  """
  a is a list
  b is a list of lists
  flatten the lists of b into a
  """
  for sublist in b:
      a.extend(sublist)

# Concatenate clips
def mem():
    memory = psutil.virtual_memory()
    available_memory_gb = memory.available / (1024 ** 3)
    print(f"Available Memory: {available_memory_gb:.2f} GB")

def fd(l, key, value):
  # find dict in list of dicts
  # this could return multiple dicts..
  # we'll assume one dict returned
  for d in l:
      if d[key] == value:
        return d
  return None

def rm(path):
    """
    Remove a file or folder and all its contents if it's a folder.

    :param path: The path to the file or folder to be removed
    """
    try:
        if os.path.isdir(path):
            shutil.rmtree(path)
            print(f"Successfully removed the folder: {path}")
        elif os.path.isfile(path):
            os.remove(path)
            print(f"Successfully removed the file: {path}")
        else:
            print(f"The path does not exist: {path}")
    except Exception as e:
        print(f"Error removing the path: {e}")

def mkdir(dir):
  os.makedirs(dir, exist_ok=True)

def rm_mkdir(dir):
  rm(dir)
  os.makedirs(dir, exist_ok=True)


def pd(o, fp):
    with open(fp, 'wb') as f:
        pickle.dump(o, f)


def pl(fp):
    with open(fp, 'rb') as f:
        return pickle.load(f)


def p(x) -> Print:
    print(x)


def w(x, fp):
    with open(fp, 'w') as f:
        f.write(x)

def wb(x, fp):
    with open(fp, 'wb') as f:
        f.write(x)

def wa(x, fp):
    with open(fp, 'a') as f:
        f.write(x)

def rl(f):
    with open(f, 'r') as u:
        return u.readlines()

def r(f):
    with open(f, 'r') as u:
        return u.read()

def rb(file_path):
    """
    Read the file in binary mode and return the content.
    """
    with open(file_path, 'rb') as file:  # Notice 'rb' for reading in binary mode
        return file.read()


def jl(jf):
    with open(jf, 'r') as f:
        return json.load(f)


def jd(x, fp):
    with open(fp, 'w') as f:
        json.dump(x, f, indent=2)

def jls(j):
    return json.loads(j)

def ls(dir):
  """
  Returns [dir/child_dir1, dir/child_dir2, ...]

  Example:
  utils.ls('twitch_streams')
  -> ['twitch_streams/royal2','twitch_streams/renegade',...]
  """
  return [os.path.join(dir, f) for f in os.listdir(dir)]

"""
def w(f):
    with open(f, 'w') as u:
        return json.loads(u.read())
"""

#from bs4 import BeautifulSoup
#def soup(url): 
#  response = requests.get(url)
#  if response.status_code == 200:
#    return BeautifulSoup(response.content, 'html.parser')
#  else:
#    print(f'non-200 response with {url}')
#    exit()
#      # throw an error?
#      # print? 
#      # Do I want calling code to catch?

def everything_before_extension(filename):

  pattern = r'^(.*)\.mp4$'

  match = re.match(pattern, filename)
  if match:
      base = match.group(1)
  return base

def get_file_basename(file_path):
  # Split the path by '/'
  path_parts = file_path.split('/')

  # Extract the last part (filename) and then split by '.' to remove the extension
  file_name_without_extension = path_parts[-1].split('.')[0]

  return file_name_without_extension


def source_env(script_path):
    """
    Source environment variables from a shell script into the current environment.
    """
    # Command to source the script and then output the environment
    command = f"source {script_path} && env"
    
    # Run the command and capture the output
    proc = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True, executable='/bin/bash')
    out, err = proc.communicate()

    # Set the sourced environment variables in the current environment
    for line in out.splitlines():
        key, _, value = line.partition(b"=")
        os.environ[key.decode()] = value.decode()
