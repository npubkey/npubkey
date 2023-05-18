import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageServiceService {

    constructor(private http: HttpClient) { }

    uploadImage(file: File | Blob): Observable<string> {
        // returns url of uploaded image
        console.log('upload image')
        let url = "https://nostr.build/api/upload/snort.php";
        const fd = new FormData();
        fd.append("fileToUpload", file);
        fd.append("submit", "Upload Image");
        return this.http.post<string>(url, fd);
    }
}
