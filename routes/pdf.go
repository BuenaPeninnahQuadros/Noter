package routes

import (
    "encoding/json"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "strings"

    pdf "github.com/ledongthuc/pdf"
)

type pdfExtractResponse struct {
    Text string `json:"text"`
}

// ExtractPDFText extracts plain text content from uploaded PDF files.
func ExtractPDFText(w http.ResponseWriter, r *http.Request) {
    if err := r.ParseMultipartForm(20 << 20); err != nil {
        http.Error(w, "invalid form data", http.StatusBadRequest)
        return
    }

    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "missing file", http.StatusBadRequest)
        return
    }
    defer file.Close()

    if strings.ToLower(filepath.Ext(header.Filename)) != ".pdf" {
        http.Error(w, "only .pdf is supported", http.StatusBadRequest)
        return
    }

    tmp, err := os.CreateTemp("", "upload-*.pdf")
    if err != nil {
        http.Error(w, "temp file error", http.StatusInternalServerError)
        return
    }
    defer os.Remove(tmp.Name())
    defer tmp.Close()

    if _, err := io.Copy(tmp, file); err != nil {
        http.Error(w, "file copy error", http.StatusInternalServerError)
        return
    }

    f, reader, err := pdf.Open(tmp.Name())
    if err != nil {
        http.Error(w, "failed to open pdf", http.StatusBadRequest)
        return
    }
    defer f.Close()

    var text string
    totalPage := reader.NumPage()
    for i := 1; i <= totalPage; i++ {
        p := reader.Page(i)
        if p.V.IsNull() {
            continue
        }
        content, err := p.GetPlainText(nil)
        if err == nil {
            text += content + "\n"
        }
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(pdfExtractResponse{Text: text})
}
