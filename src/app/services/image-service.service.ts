import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageServiceService {

    baseUrl = "https://nostrimg.com";

    constructor(private http: HttpClient) { }

    // TODO
    // uploadImage(imageData: ImageData): Observable<Response> {
    //     let url = `${this.baseUrl}/api/upload`;
    //     const fd = new FormData();
    //     let name_post_combo = `${imageData.filename},${imageData.id}`;
    //     fd.append('image', imageData.file, name_post_combo);
    //     return this.http.post<BaseResponse>(url, fd);
    // }
}
