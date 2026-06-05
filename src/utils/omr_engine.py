import sys
import cv2
import numpy as np
from pyzbar.pyzbar import decode
import json

def process_image(image_path):
    try:
        # 1. Read Image
        img = cv2.imread(image_path)
        if img is None:
            raise Exception("Gagal membaca gambar.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Decode QR Code to get anchor
        qr_codes = decode(gray)
        
        if not qr_codes:
            # Fallback 1: enhance contrast and try again
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            gray_enhanced = clahe.apply(gray)
            qr_codes = decode(gray_enhanced)
            
        if not qr_codes:
            # Fallback 2: Adaptive Thresholding (mengatasi pencahayaan tidak merata)
            thresh_qr1 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 5)
            qr_codes = decode(thresh_qr1)
            
        if not qr_codes:
            # Fallback 3: Gaussian Blur + Otsu Thresholding (mengatasi bintik noise)
            blur = cv2.GaussianBlur(gray, (5,5), 0)
            _, thresh_qr2 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            qr_codes = decode(thresh_qr2)
            
        if not qr_codes:
            # Fallback 4: Resize (kadang QR terlalu kecil atau resolusi gambar terlalu besar)
            resized = cv2.resize(gray, (0, 0), fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
            qr_codes = decode(resized)

        if not qr_codes:
            raise Exception("QR Code tidak terdeteksi. Pastikan resolusi scan cukup dan gambar QR tidak buram.")

        # Ambil QR code pertama
        qr = qr_codes[0]
        qr_data = qr.data.decode('utf-8')
        metadata = json.loads(qr_data)
        
        # Ekstrak titik sudut QR Code
        polygon = qr.polygon
        if len(polygon) != 4:
            # Fallback to rect
            rect = qr.rect
            polygon = [
                (rect.left, rect.top),
                (rect.left + rect.width, rect.top),
                (rect.left + rect.width, rect.top + rect.height),
                (rect.left, rect.top + rect.height)
            ]

        pts = np.array(polygon, np.int32)
        
        # Urutkan titik: TL, TR, BR, BL
        # Jumlah x+y: terkecil TL, terbesar BR
        # Selisih x-y: terkecil BL, terbesar TR
        s = pts.sum(axis=1)
        diff = np.diff(pts, axis=1)
        
        tl = pts[np.argmin(s)]
        br = pts[np.argmax(s)]
        tr = pts[np.argmin(diff)]
        bl = pts[np.argmax(diff)]
        
        # Hitung rotasi untuk meluruskan berdasarkan sisi atas QR
        dx = tr[0] - tl[0]
        dy = tr[1] - tl[1]
        angle = np.degrees(np.arctan2(dy, dx))
        
        # Dapatkan pusat gambar untuk rotasi
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        deskewed = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        # 3. Temukan Kotak Tabel
        gray_deskewed = cv2.cvtColor(deskewed, cv2.COLOR_BGR2GRAY)
        
        # Binarization
        thresh = cv2.adaptiveThreshold(gray_deskewed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 10)
        
        # Morphological operations to find horizontal lines
        kernel_len = w // 40
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_len, 1))
        horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
        
        # Find horizontal lines contours
        h_contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        h_lines_y = []
        for c in h_contours:
            x, y, w_box, h_box = cv2.boundingRect(c)
            if w_box > w * 0.5: # Garis setidaknya setengah lebar gambar
                h_lines_y.append(y)
                
        h_lines_y = sorted(list(set(h_lines_y)))
        
        # Hapus garis yang terlalu berdekatan (kurang dari 10 px)
        clean_h_lines = []
        if len(h_lines_y) > 0:
            clean_h_lines.append(h_lines_y[0])
            for i in range(1, len(h_lines_y)):
                if h_lines_y[i] - clean_h_lines[-1] > 10:
                    clean_h_lines.append(h_lines_y[i])
                    
        # Cari jarak rata-rata antar garis (Tinggi baris / Row Height)
        median_h = 29
        first_row_y = 0
        if len(clean_h_lines) > 2:
            diffs = [clean_h_lines[i] - clean_h_lines[i-1] for i in range(1, len(clean_h_lines))]
            sorted_diffs = sorted(diffs)
            median_h = sorted_diffs[len(sorted_diffs) // 2]
            
            # Cari baris data pertama (pasangan garis dengan jarak median_h yang di bawah QR)
            # Dapatkan posisi QR setelah rotasi (aproksimasi)
            qr_pts = np.array([tl, tr, br, bl])
            qr_pts_homog = np.insert(qr_pts, 2, 1, axis=1)
            qr_pts_deskewed = np.dot(qr_pts_homog, M.T)
            qr_bl_y = max([pt[1] for pt in qr_pts_deskewed])
            
            # Sequence terpanjang
            longest_seq = []
            curr_seq = [clean_h_lines[0]]
            for i in range(1, len(clean_h_lines)):
                d = clean_h_lines[i] - clean_h_lines[i-1]
                if abs(d - median_h) < median_h * 0.3:
                    curr_seq.append(clean_h_lines[i])
                else:
                    if len(curr_seq) > len(longest_seq):
                        longest_seq = curr_seq
                    curr_seq = [clean_h_lines[i]]
            if len(curr_seq) > len(longest_seq):
                longest_seq = curr_seq
                
            if len(longest_seq) > 2:
                exact_median_h = (longest_seq[-1] - longest_seq[0]) / (len(longest_seq) - 1)
                
                estimated_first_row = qr_bl_y + (45 * (median_h / 29.5)) # Aproksimasi
                steps = round((longest_seq[0] - estimated_first_row) / exact_median_h)
                first_row_y = longest_seq[0] - (steps * exact_median_h)
                median_h = exact_median_h
            else:
                first_row_y = qr_bl_y + (47.5 * (median_h / 29.5))
        
        # X coordinates sama seperti logika JS
        qr_w = np.linalg.norm(qr_pts_deskewed[1] - qr_pts_deskewed[0])
        qr_h = np.linalg.norm(qr_pts_deskewed[3] - qr_pts_deskewed[0])
        scale_x = qr_w / 85.0
        scale_y = qr_h / 85.0
        
        # Geometri Exact dari QR (Sangat presisi)
        qr_tr_x = qr_pts_deskewed[1][0]
        grid_right_edge = qr_tr_x + (12 * scale_x)
        table_width = 737 * scale_x
        table_left_edge = grid_right_edge - table_width
        
        nilai_left = table_left_edge + (0.32 * table_width)
        nilai_right = table_left_edge + (0.70 * table_width)
            
        nilai_w = nilai_right - nilai_left
        item_widths = [15,15,15,15,15,15,15,15,15,15,15,5.5,15]
        
        # Flexbox Exact logic seperti di JS
        container_inner_px = nilai_w - (8 * scale_x)
        item_widths_px = [w * scale_x for w in item_widths]
        total_items_width_px = sum(item_widths_px)
        flex_gap_px = (container_inner_px - total_items_width_px) / 12.0
        
        item_centers_px = []
        curr_x = nilai_left + (4 * scale_x)
        for iw_px in item_widths_px:
            item_centers_px.append(curr_x + (iw_px / 2.0))
            curr_x += iw_px + flex_gap_px
            
        bubble_map = [0,1,2,3,4,5,6,7,8,9,10,12] # Sesuai dengan JS!
        bubble_values = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 5]
        
        results = []
        debug_boxes = []
        
        # Analisis 25 baris
        for i in range(25):
            expected_y = first_row_y + (i * exact_median_h) if exact_median_h else first_row_y + (i * median_h)
            
            # Snap ke garis terdekat
            closest = expected_y
            if len(clean_h_lines) > 0:
                closest_line = min(clean_h_lines, key=lambda x: abs(x - expected_y))
                if abs(closest_line - expected_y) < median_h * 0.4:
                    closest = closest_line
                    
            if i < 24:
                expected_next_y = first_row_y + ((i+1) * exact_median_h) if exact_median_h else first_row_y + ((i+1) * median_h)
                closest_next = expected_next_y
                if len(clean_h_lines) > 0:
                    closest_next_line = min(clean_h_lines, key=lambda x: abs(x - expected_next_y))
                    if abs(closest_next_line - expected_next_y) < median_h * 0.4:
                        closest_next = closest_next_line
                row_h = closest_next - closest
            else:
                row_h = exact_median_h if exact_median_h else median_h
                
            cy = int(closest + (row_h / 2))
            
            probe_w = int(10 * scale_x)
            probe_h = int(min(row_h * 0.35, 10 * scale_y))
            hw = probe_w // 2
            hh = probe_h // 2
            
            crossed_tens = []
            has_five = False
            
            for b in range(12):
                cx = int(item_centers_px[bubble_map[b]])
                
                # Boundary check
                if cy-hh < 0 or cy+hh >= h or cx-hw < 0 or cx+hw >= w:
                    continue
                    
                roi = gray_deskewed[cy-hh:cy+hh, cx-hw:cx+hw]
                
                # Hitung pixel gelap (kurang dari 160)
                dark_pixels = np.sum(roi < 160)
                total_pixels = roi.size
                
                ratio = float(dark_pixels / total_pixels) if total_pixels > 0 else 0.0
                
                is_crossed = ratio > 0.25
                debug_boxes.append({
                    "x": cx - hw,
                    "y": cy - hh,
                    "w": probe_w,
                    "h": probe_h,
                    "crossed": is_crossed,
                    "ratio": ratio
                })
                
                if is_crossed: # Lebih dari 25% area ditutupi tinta hitam
                    if bubble_values[b] == 5:
                        has_five = True
                    else:
                        crossed_tens.append(bubble_values[b])
                        
            final_score = None
            if len(crossed_tens) == 1:
                if crossed_tens[0] == 100 and has_five:
                    final_score = None # 100+5 tidak valid
                else:
                    final_score = crossed_tens[0] + (5 if has_five else 0)
            elif len(crossed_tens) == 0 and has_five:
                final_score = 5
                
            results.append({
                "index": i,
                "finalScore": final_score
            })

        # Encode image to base64 with drawn boxes for visual feedback
        for box in debug_boxes:
            color = (0, 255, 0) if box['crossed'] else (0, 0, 255)
            thickness = 3 if box['crossed'] else 1
            cv2.rectangle(deskewed, (box['x'], box['y']), (box['x'] + box['w'], box['y'] + box['h']), color, thickness)
            
        _, buffer = cv2.imencode('.jpg', deskewed, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        img_base64 = __import__('base64').b64encode(buffer).decode('utf-8')

        output = {
            "success": True,
            "metadata": metadata,
            "results": results,
            "processedImage": f"data:image/jpeg;base64,{img_base64}"
        }
        print(json.dumps(output))

    except Exception as e:
        output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(output))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        process_image(image_path)
    else:
        print(json.dumps({"success": False, "error": "Path gambar tidak diberikan."}))
