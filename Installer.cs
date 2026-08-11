using System;
using System.Drawing;
using System.Windows.Forms;
using System.IO;
using Microsoft.Win32;
using System.Drawing.Drawing2D;
using System.Reflection;
using System.Net;

namespace ReySkripsiInstaller
{
    public class InstallerForm : Form
    {
        private Button btnInstall;
        private Button btnUninstall;
        private Label lblStatus;
        private Panel headerPanel;
        private Label lblTitle;
        private Label lblSubtitle;
        private PictureBox picAvatar;

        public InstallerForm()
        {
            this.Text = "ReySkripsi Manager - Rey Workbench";
            this.Size = new Size(480, 320);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 249, 250);

            // Header Panel
            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 85;
            headerPanel.BackColor = Color.FromArgb(36, 36, 36);
            this.Controls.Add(headerPanel);

            // Avatar PictureBox
            picAvatar = new PictureBox();
            picAvatar.Size = new Size(52, 52);
            picAvatar.Location = new Point(16, 16);
            picAvatar.SizeMode = PictureBoxSizeMode.StretchImage;
            picAvatar.BackColor = Color.Transparent;
            headerPanel.Controls.Add(picAvatar);

            // Load Embedded Avatar Image or Download from URL Fallback
            LoadAvatarImage();

            lblTitle = new Label();
            lblTitle.Text = "ReySkripsi Manager";
            lblTitle.Font = new Font("Segoe UI", 15, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(78, 16);
            lblTitle.AutoSize = true;
            lblTitle.BackColor = Color.Transparent;
            headerPanel.Controls.Add(lblTitle);

            lblSubtitle = new Label();
            lblSubtitle.Text = "Add-in Penulisan Skripsi Cerdas • Rey Workbench";
            lblSubtitle.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(180, 205, 235);
            lblSubtitle.Location = new Point(80, 48);
            lblSubtitle.AutoSize = true;
            lblSubtitle.BackColor = Color.Transparent;
            headerPanel.Controls.Add(lblSubtitle);

            // Body Area Description
            Label lblDesc = new Label();
            lblDesc.Text = "Klik tombol di bawah ini untuk memasang atau menghapus\nAdd-in ReySkripsi dari Microsoft Word Anda secara otomatis.";
            lblDesc.Font = new Font("Segoe UI", 9.5f);
            lblDesc.ForeColor = Color.FromArgb(51, 51, 51);
            lblDesc.Location = new Point(22, 105);
            lblDesc.AutoSize = true;
            this.Controls.Add(lblDesc);

            // Install Button
            btnInstall = new Button();
            btnInstall.Text = "Install Add-in";
            btnInstall.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(0, 120, 212);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Size = new Size(195, 45);
            btnInstall.Location = new Point(22, 165);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);

            // Uninstall Button
            btnUninstall = new Button();
            btnUninstall.Text = "Uninstall Add-in";
            btnUninstall.Font = new Font("Segoe UI", 9.5f);
            btnUninstall.BackColor = Color.White;
            btnUninstall.ForeColor = Color.FromArgb(70, 70, 70);
            btnUninstall.FlatStyle = FlatStyle.Flat;
            btnUninstall.FlatAppearance.BorderColor = Color.FromArgb(200, 200, 200);
            btnUninstall.Size = new Size(195, 45);
            btnUninstall.Location = new Point(235, 165);
            btnUninstall.Cursor = Cursors.Hand;
            btnUninstall.Click += BtnUninstall_Click;
            this.Controls.Add(btnUninstall);

            // Status Label
            lblStatus = new Label();
            lblStatus.Text = "Status: Siap dipasang.";
            lblStatus.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblStatus.Location = new Point(22, 235);
            lblStatus.AutoSize = true;
            lblStatus.ForeColor = Color.FromArgb(100, 100, 100);
            this.Controls.Add(lblStatus);
        }

        private void LoadAvatarImage()
        {
            try
            {
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("avatar.png"))
                {
                    if (stream != null)
                    {
                        picAvatar.Image = Image.FromStream(stream);
                        return;
                    }
                }
            }
            catch { }

            // Fallback download if embedded resource fails
            try
            {
                using (WebClient client = new WebClient())
                {
                    byte[] data = client.DownloadData("https://avatars.githubusercontent.com/u/233570773?s=200&v=4");
                    using (MemoryStream ms = new MemoryStream(data))
                    {
                        picAvatar.Image = Image.FromStream(ms);
                    }
                }
            }
            catch { }
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            try
            {
                lblStatus.Text = "Status: Menginstal...";
                Application.DoEvents();

                string targetDir = @"C:\Addins";
                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                string targetManifest = Path.Combine(targetDir, "manifest.xml");

                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("manifest.xml"))
                {
                    if (stream == null)
                    {
                        throw new Exception("File manifest internal tidak ditemukan di dalam installer!");
                    }
                    using (FileStream fileStream = new FileStream(targetManifest, FileMode.Create))
                    {
                        stream.CopyTo(fileStream);
                    }
                }

                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"SOFTWARE\Microsoft\Office\16.0\Wef\Developer"))
                {
                    key.SetValue("ReySkripsi", targetManifest);
                }

                lblStatus.Text = "Status: Berhasil diinstal! Silakan buka Word.";
                lblStatus.ForeColor = Color.FromArgb(0, 120, 212);
                MessageBox.Show("ReySkripsi berhasil dipasang!\n\nSilakan buka MS Word -> Buka dokumen -> Tab Home -> klik Add-ins -> pilih Developer/My Add-ins.", "Instalasi Selesai", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal menginstal:\n" + ex.Message, "Error Instalasi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus.Text = "Status: Gagal.";
                lblStatus.ForeColor = Color.Red;
            }
        }

        private void BtnUninstall_Click(object sender, EventArgs e)
        {
            try
            {
                lblStatus.Text = "Status: Menghapus...";
                Application.DoEvents();

                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Office\16.0\Wef\Developer", true))
                {
                    if (key != null && key.GetValue("ReySkripsi") != null)
                    {
                        key.DeleteValue("ReySkripsi");
                    }
                }

                lblStatus.Text = "Status: Berhasil dihapus.";
                lblStatus.ForeColor = Color.FromArgb(60, 60, 60);
                MessageBox.Show("ReySkripsi telah berhasil dihapus dari Microsoft Word.", "Uninstall Selesai", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal meng-uninstall:\n" + ex.Message, "Error Uninstall", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus.Text = "Status: Gagal.";
                lblStatus.ForeColor = Color.Red;
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
